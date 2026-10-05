import { defineTool } from "eve/tools";
import { z } from "zod";
import { harvestSitePhotos } from "#lib/scrape";
import { getProposal, updateProposal, logEvent } from "#lib/db";

export default defineTool({
  description:
    "Nivel 0 de la escalera de imágenes (PRD sección 7): barre el sitio de la escuela en busca de sus propias fotos, ANTES de considerar generar algo con IA. Devuelve las URLs candidatas con su resolución real (ya verificada, no solo el atributo del HTML) y una descripción de cada una. Un modelo con visión ya descartó gráficos, logos, capturas y fotos con texto encima: `rejected` dice cuáles y por qué. Úsalo justo después de start_proposal. Si devuelve pocas o ninguna candidata, o marca `error`, no insistas: pasa a generate_ai_photo para los espacios que falten.",
  inputSchema: z.object({
    proposalId: z.string(),
  }),
  label: { start: () => "Buscar fotos en el sitio de la escuela" },
  async execute({ proposalId }) {
    const proposal = await getProposal(proposalId);
    if (!proposal) return { error: `La propuesta ${proposalId} no existe.` };

    await updateProposal(proposalId, { status: "harvesting" });
    const { candidates, rejected, screening, error } = await harvestSitePhotos(proposal.website_url);
    await logEvent(proposalId, "site_harvested", { count: candidates.length, rejected: rejected?.length ?? 0, screening, error });

    if (error) {
      return {
        error,
        candidates: [],
        note: "El sitio no dio fotos utilizables. Dile al equipo que vas a generar las 3 con IA y sigue con generate_ai_photo.",
      };
    }
    if (candidates.length === 0) {
      return {
        candidates: [],
        rejected,
        note: "El sitio no tiene fotos utilizables: o no pasan el mínimo de 600px de lado largo, o son gráficos con texto encima (ver rejected). Sigue con generate_ai_photo para portada, misión y Centralized Enrollment.",
      };
    }
    return {
      candidates,
      rejected,
      screening,
      note: "Para la PORTADA usa la de mayor resolución disponible — es la foto más visible del documento (mínimo 1200px de lado largo; si ninguna candidata llega, genera esa con IA en vez de estirarla). Para misión y Centralized Enrollment, mínimo 800px. Usa la descripción para elegir: alumnos en actividad real para la portada, alumnos con docentes para misión. Llama a set_slot_photo con la URL elegida para cada espacio; una foto distinta por espacio.",
    };
  },
});
