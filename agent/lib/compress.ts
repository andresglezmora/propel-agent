import sharp from "sharp";
import type { PhotoSlotId } from "../../react/modules/types";

// Las fotos se guardan tal como llegan (una imagen de IA es un PNG de 1024 px
// y 2 a 3 MB; una del sitio puede ser un JPG de 4000 px). Antes de meterlas
// al PDF se reducen al tamaño que de verdad ocupan en la página y se pasan a
// JPEG: sin esto, dos fotos de IA bastan para pasar el tope de 8 MB.
//
// Lado largo máximo por espacio, a ~2x la resolución impresa del hueco.
const MAX_LONG_SIDE: Record<PhotoSlotId, number> = { cover: 1600, mission: 1200, centralized: 1200 };
const QUALITY = 82;

export async function compressForPdf(slot: PhotoSlotId, bytes: Buffer): Promise<{ data: Buffer; format: "jpg" }> {
  const max = MAX_LONG_SIDE[slot];
  const data = await sharp(bytes)
    .rotate() // respeta la orientación EXIF de fotos de teléfono
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" }) // PNG con transparencia -> fondo blanco
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();
  return { data, format: "jpg" };
}
