import { telegramChannel, defaultTelegramAuth } from "eve/channels/telegram";
import type { TelegramContext, TelegramEventContext, TelegramMessage } from "eve/channels/telegram";
import { toolResultFrom } from "eve/tools";
import deliverProposalTool from "../tools/deliver_proposal";
import renderProposalTool from "../tools/render_proposal";
import { getProposal, getLatestVersion, signedUrlFor, downloadFromBucket } from "#lib/db";
import { proposalFileName } from "#lib/names";

// Canal principal de Propel: por aquí el equipo pide propuestas, Propel
// pregunta lo que falta y entrega el PDF. La Web UI llega después.

// Fail-closed: sin TELEGRAM_ALLOWED_CHAT_IDS el bot no acepta ningún chat.
// Si no, cualquiera que encuentre el username podría generar propuestas
// (gasta tokens) con precios internos de TrustED.
const ALLOWED_CHAT_IDS = (process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

if (ALLOWED_CHAT_IDS.length === 0) {
  console.warn(
    "[telegram] TELEGRAM_ALLOWED_CHAT_IDS no está configurada: el bot no aceptará ningún chat.",
  );
}

async function react(channel: TelegramEventContext, emoji: string): Promise<void> {
  const chatId = channel.state.chatId;
  const messageId = channel.state.conversationId;
  if (!chatId || !messageId) return;
  try {
    await channel.telegram.request("setMessageReaction", {
      chat_id: chatId,
      message_id: messageId,
      reaction: [{ type: "emoji", emoji }],
    });
  } catch {
    // cosmética, nunca debe tumbar el turno
  }
}

// Telegram nombra el archivo según la URL cuando se manda por link (saldría
// "v1.pdf"). Subiendo los bytes con multipart el nombre es el que se pida.
async function sendPdf(chatId: string | number, storagePath: string, fileName: string, caption: string) {
  const bytes = await downloadFromBucket(storagePath);
  const form = new FormData();
  form.set("chat_id", String(chatId));
  form.set("caption", caption);
  form.set("document", new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), fileName);
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`sendDocument ${res.status}`);
}

export default telegramChannel({
  credentials: {
    botToken: () => process.env.TELEGRAM_BOT_TOKEN!,
    webhookSecretToken: () => process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN!,
  },
  onMessage(_ctx: TelegramContext, message: TelegramMessage) {
    if (!ALLOWED_CHAT_IDS.includes(String(message.chat.id))) return null;
    return { auth: defaultTelegramAuth(message) };
  },
  uploadPolicy: {
    // Notas de discovery, RFPs de distritos y logos de la escuela.
    allowedMediaTypes: ["image/*", "application/pdf"],
    maxBytes: 10 * 1024 * 1024,
  },
  events: {
    // Hito "listo para aprobar": el modelo está a punto de llamar a
    // deliver_proposal (antes de que eve muestre el botón de aprobación
    // genérico, que no muestra el PDF). Se manda el archivo real aquí, para
    // que quien aprueba lo vea antes de decidir — mismo patrón que
    // LandingPilot usa con un screenshot antes de aprobar un sitio.
    async "actions.requested"(event, channel) {
      const call = event.actions.find(
        (a): a is Extract<(typeof event.actions)[number], { kind: "tool-call" }> =>
          a.kind === "tool-call" && a.toolName === "deliver_proposal",
      );
      if (!call) return;
      await react(channel, "👀");

      const proposalId = typeof call.input.proposalId === "string" ? call.input.proposalId : undefined;
      if (!proposalId) return;

      const [proposal, latest] = await Promise.all([getProposal(proposalId), getLatestVersion(proposalId)]);
      if (!proposal || !latest) return;

      try {
        await sendPdf(
          channel.telegram.chatId,
          latest.storage_path,
          proposalFileName(proposal.school_name),
          `Proposal - ${proposal.school_name}.pdf (v${latest.version}) — revisa antes de aprobar`,
        );
      } catch {
        // El botón de aprobación llega igual aunque esto falle.
      }
    },
    async "action.result"(event, channel) {
      // El preview se manda como archivo desde aquí y no como link en el
      // texto del modelo (ver nota en render_proposal).
      const rendered = toolResultFrom(event.result, renderProposalTool);
      if (rendered && "storagePath" in rendered.output && rendered.output.storagePath) {
        try {
          const proposal = await getProposal(rendered.output.storagePath.split("/")[0]!);
          await sendPdf(
            channel.telegram.chatId,
            rendered.output.storagePath,
            proposalFileName(proposal?.school_name ?? "Preview", ` (preview v${rendered.output.version})`),
            `Preview v${rendered.output.version}`,
          );
        } catch {
          // Si falla, el modelo avisa que no pudo adjuntarlo.
        }
      }
      const delivered = toolResultFrom(event.result, deliverProposalTool);
      if (delivered && "storagePath" in delivered.output && delivered.output.storagePath) {
        await react(channel, "✅");
        try {
          const { schoolName, version, storagePath } = delivered.output;
          const fileName = proposalFileName(schoolName ?? "Propuesta");
          const url = await signedUrlFor(storagePath, 60 * 60 * 24 * 30, fileName);
          await sendPdf(channel.telegram.chatId, storagePath, fileName, `${fileName} (v${version})`);
          await channel.telegram.request("sendMessage", {
            chat_id: channel.telegram.chatId,
            text: `Link de descarga (30 días):\n${url}`,
          });
        } catch {
          // El modelo ya confirmó la entrega; el archivo se puede pedir de nuevo.
        }
      }
    },
  },
});
