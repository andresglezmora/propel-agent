import { defineTool } from "eve/tools";
import { z } from "zod";
import { createProposal, logEvent } from "#lib/db";

export default defineTool({
  description:
    "Primer paso de una propuesta nueva: crea el registro con el nombre de la escuela (y sus variantes: posesivo, corto), el sitio, y si es un solo campus o una red. Llama a esto en cuanto tengas esos 3 datos; si dudas de cómo se escribe el posesivo de un nombre raro, pregunta antes de seguir en vez de adivinar.",
  inputSchema: z.object({
    schoolName: z.string().min(2).describe('Nombre tal cual debe aparecer, ej. "PROUD Academy".'),
    schoolShort: z
      .string()
      .optional()
      .describe('Forma corta opcional si el nombre completo es largo, ej. "PROUD" para "PROUD Academy".'),
    websiteUrl: z.string().describe("Sitio de la escuela, con o sin https://."),
    campusMode: z
      .enum(["single", "network"])
      .describe("'single' si es un solo plantel, 'network' si son varios campus/distrito."),
    requestedBy: z.string().optional().describe("Quién la pidió (nombre o usuario de Telegram)."),
    telegramChatId: z.string().optional(),
    coworkThreadId: z
      .string()
      .optional()
      .describe('Solo si la petición viene de un hilo de Scale: el threadId que traía el mensaje, copiado tal cual.'),
  }),
  label: { start: ({ schoolName }) => `Crear propuesta para ${schoolName}` },
  async execute(input, ctx) {
    // Preferimos el threadId que Scale estampó en la sesión; el del input es respaldo.
    const fromSession = ctx.session.auth.initiator?.attributes?.threadId;
    const coworkThreadId = typeof fromSession === "string" ? fromSession : input.coworkThreadId;
    const websiteUrl = /^https?:\/\//i.test(input.websiteUrl) ? input.websiteUrl : `https://${input.websiteUrl}`;
    const proposal = await createProposal({ ...input, websiteUrl, coworkThreadId });
    await logEvent(proposal.id, "created", { schoolName: input.schoolName, websiteUrl });
    return {
      proposalId: proposal.id,
      schoolName: proposal.school_name,
      schoolPossessive: proposal.school_possessive,
      schoolShort: proposal.school_short,
      websiteUrl: proposal.website_url,
      campusMode: proposal.campus_mode,
      status: proposal.status,
    };
  },
});
