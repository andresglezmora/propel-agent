import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Los assets FIJOS del PDF (fuentes, logos, capturas de producto) se leen
// por ruta desde el disco. En local existen en el repo; en Vercel NO: el
// bundle solo lleva el código que el bundler traza, y una ruta armada como
// string no se traza. Mismo problema que resolvió LandingPilot con su
// plantilla (agent/lib/deploy.ts): los assets viven en Supabase Storage
// (bucket privado, carpeta _assets/) y se bajan a /tmp la primera vez que
// una instancia los necesita. /tmp sobrevive entre invocaciones de una
// misma instancia caliente, así que el costo es solo el arranque en frío.
//
// `npm run assets:upload` sube esta lista a Storage (scripts/upload-assets.ts).
// Si agregas un asset nuevo a la plantilla, agrégalo aquí también, o el
// deploy funcionará en local y fallará en Vercel.

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TMP_ROOT = path.join(os.tmpdir(), "propel-assets");
const BUCKET = "propel-proposals";
const STORAGE_PREFIX = "_assets";

export const FIXED_ASSET_PATHS = [
  "assets/fonts/Manrope-Regular.ttf",
  "assets/fonts/Manrope-Medium.ttf",
  "assets/fonts/Manrope-SemiBold.ttf",
  "assets/fonts/Manrope-Bold.ttf",
  "assets/fonts/Manrope-ExtraBold.ttf",
  "assets/fonts/Inter-Regular.ttf",
  "assets/fonts/Inter-Medium.ttf",
  "assets/fonts/Inter-SemiBold.ttf",
  "assets/fonts/Inter-Bold.ttf",
  "brand/trusted-logo-dark.png",
  "brand/trusted-logo-white.png",
  "template/full-service/optimized/img8.jpg",
  "template/full-service/optimized/img9.jpg",
  "template/full-service/optimized/img10.jpg",
  "template/full-service/optimized/img11.jpg",
  "template/full-service/optimized/img12.jpg",
  "template/full-service/optimized/img13.jpg",
  "template/full-service/optimized/img14.jpg",
  "template/full-service/optimized/img15.jpg",
  "template/full-service/optimized/img16.jpg",
  "template/full-service/optimized/img17.jpg",
  "template/full-service/assets/img_286.png",
  "template/full-service/assets/img_1544.png",
  "template/full-service/assets/img_1547.png",
] as const;

export function projectRoot() {
  return ROOT;
}

/** Ruta local a un asset: la del repo si existe (desarrollo), si no la copia
 * en /tmp (Vercel) — que puede no existir todavía hasta `ensureAssets`. */
export function assetPath(rel: string): string {
  const local = path.join(ROOT, rel);
  return fs.existsSync(local) ? local : path.join(TMP_ROOT, rel);
}

export async function ensureAssets(rels: readonly string[] = FIXED_ASSET_PATHS): Promise<void> {
  const missing = rels.filter((rel) => !fs.existsSync(assetPath(rel)));
  if (missing.length === 0) return;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      `Faltan ${missing.length} assets fijos en disco y no hay SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY para bajarlos de Storage.`,
    );
  }

  await Promise.all(
    missing.map(async (rel) => {
      const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${STORAGE_PREFIX}/${rel}`, {
        headers: { Authorization: `Bearer ${key}`, apikey: key },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        throw new Error(
          `No se pudo bajar el asset ${rel} de Storage (${res.status}). ¿Corriste \`npm run assets:upload\`?`,
        );
      }
      const dest = path.join(TMP_ROOT, rel);
      await fsp.mkdir(path.dirname(dest), { recursive: true });
      await fsp.writeFile(dest, Buffer.from(await res.arrayBuffer()));
    }),
  );
}

export const STORAGE_ASSET_PREFIX = `${STORAGE_PREFIX}/`;
export const ASSETS_BUCKET = BUCKET;
