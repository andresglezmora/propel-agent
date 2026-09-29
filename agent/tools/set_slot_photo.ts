import { defineTool } from "eve/tools";
import { z } from "zod";
import { saveSlotPhoto, fetchImageBytes } from "#lib/images";
import { logEvent } from "#lib/db";

export default defineTool({
  description:
    "Fija la foto de uno de los 3 espacios (cover, mission, centralized) a partir de una URL — una candidata que devolvió harvest_site_photos, o una que te haya pasado el equipo directamente. Para generar con IA usa generate_ai_photo, no esta. Cada llamada reemplaza la foto anterior de ese espacio si ya había una.",
  inputSchema: z.object({
    proposalId: z.string(),
    slot: z.enum(["cover", "mission", "centralized"]),
    imageUrl: z.string().describe("URL de la imagen a usar en este espacio."),
  }),
  label: { start: ({ slot }) => `Fijar foto de ${slot}` },
  async execute({ proposalId, slot, imageUrl }) {
    let bytes: Buffer;
    try {
      bytes = await fetchImageBytes(imageUrl);
    } catch (err) {
      return { error: `No se pudo descargar ${imageUrl}: ${(err as Error).message}` };
    }
    const ext = /\.jpe?g(\?|$)/i.test(imageUrl) ? "jpg" : "png";
    const photo = await saveSlotPhoto({ proposalId, slot, source: "site", bytes, sourceUrl: imageUrl, ext });
    await logEvent(proposalId, "photo_set", { slot, source: "site", imageUrl });
    return { slot, source: "site", width: photo.width, height: photo.height };
  },
});
