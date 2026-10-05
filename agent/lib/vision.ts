import sharp from "sharp";

// Revisión visual de las candidatas del sitio: el filtro por nombre de archivo
// (scrape.ts) atrapa "Blog-Cover.png", pero no un flyer llamado "IMG_2034.jpg".
// Un modelo chico con visión mira cada imagen y dice si es una foto real o un
// gráfico (texto encima, logo, captura, ilustración). Cuesta alrededor de una
// décima de centavo por propuesta.
//
// Nunca bloquea: si el modelo falla o tarda, se devuelve null y la búsqueda
// sigue con el filtro por nombre, como antes.

const MODEL = "google/gemini-3.1-flash-lite";
const THUMB = 512; // lado largo de la miniatura que se manda al modelo

export type PhotoScreen = {
  kind: "photo" | "graphic" | "logo" | "screenshot" | "illustration" | "other";
  /** Texto, letreros diseñados o titulares puestos encima de la imagen. */
  textOverlay: boolean;
  people: boolean;
  description: string;
};

/** Si la imagen sirve como foto de propuesta y, si no, por qué. */
export function verdict(s: PhotoScreen): { ok: true } | { ok: false; reason: string } {
  if (s.kind !== "photo") return { ok: false, reason: `es ${s.kind}, no una foto` };
  if (s.textOverlay) return { ok: false, reason: "tiene texto encima" };
  return { ok: true };
}

const PROMPT = `You review images from a school's website to decide which can be used as photos in a printed proposal.
For each numbered image answer:
- kind: "photo" (a real photograph), "graphic" (designed piece: flyer, blog cover, banner, poster, social card), "logo", "screenshot", "illustration" or "other".
- textOverlay: true if there is designed text on top of the image (headlines, captions baked in, event titles, logos stamped over it). Text that is naturally part of the scene (a sign on a wall, a shirt print, a book cover) is NOT an overlay.
- people: true if people appear.
- description: at most 12 words, in English.
Answer ONLY with JSON: {"images":[{"n":1,"kind":"photo","textOverlay":false,"people":true,"description":"..."}]} with one entry per image, in order.`;

async function thumbnail(bytes: Buffer): Promise<string> {
  const jpg = await sharp(bytes)
    .rotate()
    .resize({ width: THUMB, height: THUMB, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 70 })
    .toBuffer();
  return `data:image/jpeg;base64,${jpg.toString("base64")}`;
}

/** Una entrada por imagen, en el mismo orden; null si la revisión no se pudo hacer. */
export async function screenImages(images: Buffer[]): Promise<PhotoScreen[] | null> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey || images.length === 0) return null;
  try {
    const thumbs = await Promise.all(images.map(thumbnail));
    const content: unknown[] = [{ type: "text", text: PROMPT }];
    thumbs.forEach((url, i) => {
      content.push({ type: "text", text: `Image ${i + 1}:` });
      content.push({ type: "image_url", image_url: { url } });
    });
    const res = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content }], temperature: 0 }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      console.warn(`[vision] el gateway respondió ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? "";
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as { images?: (PhotoScreen & { n: number })[] };
    const byN = new Map((parsed.images ?? []).map((x) => [x.n, x]));
    const out = images.map((_, i) => byN.get(i + 1));
    if (out.some((x) => !x)) {
      console.warn("[vision] la respuesta no traía todas las imágenes");
      return null;
    }
    return out.map((x) => ({
      kind: x!.kind,
      textOverlay: !!x!.textOverlay,
      people: !!x!.people,
      description: String(x!.description ?? "").slice(0, 120),
    }));
  } catch (err) {
    console.warn(`[vision] no se pudo revisar: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
