import { defineChannel, POST } from "eve/channels";
import { toolResultFrom } from "eve/tools";
import deliverProposalTool from "../tools/deliver_proposal";
import renderProposalTool from "../tools/render_proposal";
import { claimInboundMessage, getProposal } from "#lib/db";
import { proposalFileName } from "#lib/names";
import { pdfAttachment, sendToScale, typingInScale } from "#lib/cowork";

// Canal de conversación con Scale CRM (trusted-scale): el equipo le escribe a
// Propel en un canal tipo Slack y Propel responde EN EL HILO.
//
//   POST /cowork/message
//   Authorization: Bearer <PROPEL_TASK_WEBHOOK_SECRET>
//   { messageId, threadId, channelId, author: { id, name }, text,
//     attachments?: [{ fileName, url, mimeType }] }
//   → 200 {"ok": true} de inmediato; la respuesta llega después, por webhook.
//
// threadId es el address de la sesión: un hilo = una conversación = una sesión
// reanudable (puede producir varias propuestas). Scale decide QUÉ mensajes
// reenviar (los del canal de Propel o donde lo mencionen) y garantiza entrega
// al menos una vez; aquí se deduplica por messageId.

function timingSafeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i]! ^ bb[i]!;
  return diff === 0;
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.PROPEL_TASK_WEBHOOK_SECRET;
  if (!secret) return false;
  return timingSafeEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`);
}

type Attachment = { fileName?: unknown; url?: unknown; mimeType?: unknown };
type Body = {
  messageId?: unknown;
  threadId?: unknown;
  channelId?: unknown;
  author?: { id?: unknown; name?: unknown };
  text?: unknown;
  attachments?: unknown;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const APPROVAL = /^(approve|aprobar|aprobado|aprobada)$/i;

export default defineChannel({
  routes: [
    POST("/cowork/message", async (request, { from, waitUntil }) => {
      if (!isAuthorized(request)) return new Response("Unauthorized", { status: 401 });

      let body: Body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "JSON inválido" }, { status: 400 });
      }

      const messageId = str(body.messageId);
      const threadId = str(body.threadId);
      const text = str(body.text);
      const authorId = str(body.author?.id) || "unknown";
      const authorName = str(body.author?.name) || "alguien del equipo";
      if (!messageId || !threadId) return Response.json({ error: "Faltan messageId/threadId" }, { status: 400 });

      const files = (Array.isArray(body.attachments) ? (body.attachments as Attachment[]) : [])
        .map((a) => ({ fileName: str(a.fileName) || "archivo", url: str(a.url), mimeType: str(a.mimeType) }))
        .filter((a) => /^https:\/\//i.test(a.url));
      if (!text && files.length === 0) return Response.json({ error: "Mensaje vacío" }, { status: 400 });

      // Scale reintenta hasta confirmar: un mensaje ya procesado no se repite.
      if (!(await claimInboundMessage(messageId, threadId))) return Response.json({ ok: true, duplicate: true });

      // Aprobación: texto SIN envolver, o eve no lo empareja con la opción de
      // aprobar. El resto lleva el autor para que el modelo distinga a quién
      // le responde en un hilo con varias personas.
      const plain = APPROVAL.test(text) && files.length === 0;
      const attachmentNote = files.length
        ? `\n[Adjuntos: ${files.map((f) => `${f.fileName} (${f.mimeType || "?"}) ${f.url}`).join(" · ")}]`
        : "";
      const message = plain ? text : `[${authorName}] ${text}${attachmentNote}`;

      const auth = {
        authenticator: "cowork",
        principalType: "user" as const,
        principalId: authorId,
        attributes: { threadId, channelId: str(body.channelId), authorName },
      };
      waitUntil(
        (async () => {
          await typingInScale(threadId);
          await from(threadId).send(message, { auth });
        })(),
      );
      return Response.json({ ok: true });
    }),
  ],
  events: {
    // Todo lo que dice el agente vuelve al hilo.
    async "message.completed"(event, channel) {
      const text = typeof event.message === "string" ? event.message.trim() : "";
      const threadId = channel.continuation?.token;
      if (text && threadId) await sendToScale(threadId, text);
    },
    async "action.result"(event, channel) {
      const threadId = channel.continuation?.token;
      if (!threadId) return;

      const rendered = toolResultFrom(event.result, renderProposalTool);
      if (rendered && "storagePath" in rendered.output && rendered.output.storagePath) {
        try {
          const { storagePath, version } = rendered.output;
          const proposal = await getProposal(storagePath.split("/")[0]!);
          const fileName = proposalFileName(proposal?.school_name ?? "Preview", ` (preview v${version})`);
          await sendToScale(threadId, `Preview v${version}`, [await pdfAttachment(storagePath, fileName)]);
        } catch {
          // Si no se puede adjuntar, el resumen del modelo llega igual.
        }
      }

      const delivered = toolResultFrom(event.result, deliverProposalTool);
      if (delivered && "storagePath" in delivered.output && delivered.output.storagePath) {
        try {
          const { schoolName, version, storagePath } = delivered.output;
          const fileName = proposalFileName(schoolName ?? "Propuesta");
          await sendToScale(threadId, `Entregada (v${version})`, [await pdfAttachment(storagePath, fileName)]);
        } catch {
          // El modelo ya confirmó la entrega.
        }
      }
    },
    // Antes de que se resuelva la aprobación: dile al hilo cómo aprobar.
    async "actions.requested"(event, channel) {
      const threadId = channel.continuation?.token;
      const asks = event.actions.some((a) => a.kind === "tool-call" && a.toolName === "deliver_proposal");
      if (!asks || !threadId) return;
      await sendToScale(threadId, 'Lista para entregar — responde "approve" para aprobar, o pide los cambios que falten.');
    },
  },
});
