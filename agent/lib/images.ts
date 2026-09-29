import { imageSize } from "image-size";
import { recordPhoto, uploadToBucket, type PhotoSlot, type PhotoSource } from "./db";

export const MAX_AI_IMAGES_PER_PROPOSAL = 6;

/** Guarda los bytes de una foto ya elegida para un espacio: sube a Storage
 * y deja el registro en proposal_photos. La compresión/recorte real (PRD
 * sección 7: "cada foto se recorta al tamaño del espacio y se comprime")
 * queda pendiente para la fase de afinado — por ahora se guarda tal cual,
 * simplificación aceptada para este primer corte. */
export async function saveSlotPhoto(input: {
  proposalId: string;
  slot: PhotoSlot;
  source: PhotoSource;
  bytes: Buffer;
  sourceUrl?: string;
  ext?: "png" | "jpg";
}) {
  const dims = imageSize(input.bytes);
  const ext = input.ext ?? "png";
  const storagePath = `${input.proposalId}/${input.slot}.${ext}`;
  await uploadToBucket(storagePath, input.bytes, ext === "png" ? "image/png" : "image/jpeg");
  return recordPhoto({
    proposalId: input.proposalId,
    slot: input.slot,
    source: input.source,
    sourceUrl: input.sourceUrl,
    storagePath,
    width: dims.width,
    height: dims.height,
  });
}

export async function fetchImageBytes(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`No se pudo bajar ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
