import { Firecrawl } from "firecrawl";
import { imageSize } from "image-size";

/**
 * Nivel 0 de la escalera de imágenes (PRD sección 7): busca las fotos
 * propias de la escuela en su sitio, antes de considerar generar algo con
 * IA. Usa Firecrawl (formato "images") en vez de un fetch propio: renderiza
 * con un navegador real, así que un sitio que arma su galería con
 * JavaScript también entrega sus fotos — con el fetch+regex anterior esos
 * sitios llegaban vacíos.
 *
 * Se scrapean la home y, si existe, /about — la home casi siempre tiene la
 * mejor foto de portada, y /about suele tener la de alumnos con docentes
 * (la de "misión"). Cada página es una llamada de Firecrawl y cuesta
 * créditos, por eso son solo dos y no un rastreo completo.
 *
 * Después se sondea el tamaño real de cada imagen candidata (descargándola)
 * en vez de fiarse del HTML: un <img> puede declarar 1200px y servir un
 * thumbnail.
 */

export type SiteImageCandidate = {
  url: string;
  width: number;
  height: number;
};

const DECORATIVE_HINTS = /logo|icon|favicon|sprite|avatar|badge|button|arrow|bullet|spinner|placeholder|social|facebook|twitter|instagram/i;

let client: Firecrawl | null = null;
function firecrawl(): Firecrawl {
  if (!client) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) throw new Error("Falta FIRECRAWL_API_KEY en .env.local.");
    client = new Firecrawl({ apiKey, timeoutMs: 45_000 });
  }
  return client;
}

async function imagesFromPage(url: string): Promise<string[]> {
  try {
    const doc = await firecrawl().scrape(url, { formats: ["images"], timeout: 30_000 });
    return doc.images ?? [];
  } catch {
    // Una ruta candidata que no existe (404) o que Firecrawl no puede
    // renderizar no debe tumbar todo el barrido: se sigue con lo que haya.
    return [];
  }
}

async function probeImage(url: string): Promise<SiteImageCandidate | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 2000) return null; // casi seguro un ícono
    const dims = imageSize(buf);
    if (!dims.width || !dims.height) return null;
    return { url, width: dims.width, height: dims.height };
  } catch {
    return null;
  }
}

export async function harvestSitePhotos(
  websiteUrl: string,
  opts: { minLongSide?: number; maxCandidates?: number } = {},
): Promise<{ candidates: SiteImageCandidate[]; error?: string }> {
  const minLongSide = opts.minLongSide ?? 600;
  const maxCandidates = opts.maxCandidates ?? 12;

  let base: URL;
  try {
    base = new URL(websiteUrl);
  } catch {
    return { candidates: [], error: `URL inválida: ${websiteUrl}` };
  }

  if (!process.env.FIRECRAWL_API_KEY) {
    return { candidates: [], error: "Falta FIRECRAWL_API_KEY: no se puede leer el sitio de la escuela." };
  }

  const pages = [base.toString(), new URL("/about", base).toString()];
  const perPage = await Promise.all(pages.map(imagesFromPage));
  const all = [...new Set(perPage.flat())].filter((u) => /^https?:\/\//i.test(u) && !DECORATIVE_HINTS.test(u));

  if (all.length === 0) {
    return {
      candidates: [],
      error: "Firecrawl no encontró imágenes en el sitio (la home y /about). Repórtalo, no inventes fotos.",
    };
  }

  const probed = await Promise.all(all.slice(0, 40).map(probeImage));
  const candidates = probed
    .filter((c): c is SiteImageCandidate => c !== null)
    .filter((c) => Math.max(c.width, c.height) >= minLongSide)
    .sort((a, b) => b.width * b.height - a.width * a.height)
    .slice(0, maxCandidates);

  return { candidates };
}
