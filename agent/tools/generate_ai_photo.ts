import { defineTool } from "eve/tools";
import { z } from "zod";
import { generateSlotImage } from "#lib/aiImage";
import { saveSlotPhoto, MAX_AI_IMAGES_PER_PROPOSAL } from "#lib/images";
import { countAiImages, incrementAiImages, getProposal, logEvent } from "#lib/db";

export default defineTool({
  description:
    `Genera con IA la foto de un espacio (portada, misión o Centralized Enrollment) cuando el sitio de la escuela no tiene ninguna candidata útil para ese espacio. Regla fija (PRD sección 7): puede haber personas, pero nadie reconocible en primer plano — nunca un retrato posado. Tope de ${MAX_AI_IMAGES_PER_PROPOSAL} imágenes por propuesta contando regeneraciones; al llegar al tope, esta tool falla a propósito y hay que pedir una foto subida por el equipo en su lugar.`,
  inputSchema: z.object({
    proposalId: z.string(),
    slot: z.enum(["cover", "mission", "centralized"]),
  }),
  label: { start: ({ slot }) => `Generar foto con IA para ${slot}` },
  async execute({ proposalId, slot }) {
    const proposal = await getProposal(proposalId);
    if (!proposal) return { error: `La propuesta ${proposalId} no existe.` };

    const used = await countAiImages(proposalId);
    if (used >= MAX_AI_IMAGES_PER_PROPOSAL) {
      return {
        error: `Ya se generaron ${used} imágenes con IA para esta propuesta (tope: ${MAX_AI_IMAGES_PER_PROPOSAL}). Pide una foto subida por el equipo para ${slot} en vez de generar otra.`,
      };
    }

    const result = await generateSlotImage({ schoolName: proposal.school_name, slot });
    if ("error" in result) return { error: result.error };

    const photo = await saveSlotPhoto({
      proposalId,
      slot,
      source: "ai",
      bytes: result.bytes,
      ext: "png",
    });
    await incrementAiImages(proposalId);
    await logEvent(proposalId, "photo_set", { slot, source: "ai" });

    return { slot, source: "ai", width: photo.width, height: photo.height, aiImagesUsed: used + 1 };
  },
});
