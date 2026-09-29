import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { getProposal, getLatestVersion, updateProposal, logEvent } from "#lib/db";

export default defineTool({
  description:
    "Marca la propuesta como entregada. SIEMPRE pide aprobación humana antes de correr — el botón de aprobación que genera eve es genérico, así que ANTES de llamar a esta tool manda un mensaje de chat normal con el resumen (nombre de la escuela y versión, sin links) para que quien aprueba sepa qué está aprobando, no solo un botón sin contexto. El archivo mismo (el PDF ya generado por render_proposal) se lo manda el canal, no esta tool.",
  inputSchema: z.object({
    proposalId: z.string(),
    version: z.number().int().min(1).describe("La versión que se está aprobando (la que devolvió render_proposal)."),
  }),
  approval: always(),
  label: { start: ({ version }) => `Entregar versión ${version} para aprobación` },
  async execute({ proposalId, version }) {
    const proposal = await getProposal(proposalId);
    if (!proposal) return { error: `La propuesta ${proposalId} no existe.` };

    const latest = await getLatestVersion(proposalId);
    if (!latest || latest.version !== version) {
      return { error: `La versión ${version} no es la más reciente (la más reciente es ${latest?.version ?? "ninguna"}). Vuelve a renderizar si hiciste cambios.` };
    }

    await updateProposal(proposalId, { status: "delivered", approved_version: version });
    await logEvent(proposalId, "approved_and_delivered", { version });

    // El canal firma y manda el archivo + el link de 30 días (PRD); el modelo
    // nunca ve un URL firmado porque lo re-escribe con errores.
    return {
      schoolName: proposal.school_name,
      version,
      storagePath: latest.storage_path,
      note: `Proposal - ${proposal.school_name}.pdf entregado. El canal ya mandó el archivo y el link de descarga (30 días): NO pegues ningún link, solo confirma la entrega en una línea.`,
    };
  },
});
