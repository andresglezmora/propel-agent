#!/usr/bin/env node
/**
 * Sube los assets fijos del PDF (react/assets.ts → FIXED_ASSET_PATHS) al
 * bucket privado propel-proposals, carpeta _assets/. Correr una vez, y de
 * nuevo cada vez que cambie o se agregue un asset de la plantilla.
 *
 * Uso: npm run assets:upload
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import { ASSETS_BUCKET, FIXED_ASSET_PATHS, STORAGE_ASSET_PREFIX, projectRoot } from "../react/assets";

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Privado a propósito: los assets y los PDFs solo se sirven con la
  // service_role o con links firmados. La migración también lo crea
  // (on conflict do nothing); esto lo cubre si aún no se corrió.
  const { error: bucketError } = await supabase.storage.createBucket(ASSETS_BUCKET, { public: false });
  if (bucketError && !/already exists/i.test(bucketError.message)) throw bucketError;

  let bytes = 0;
  for (const rel of FIXED_ASSET_PATHS) {
    const data = await fs.readFile(path.join(projectRoot(), rel));
    const contentType = rel.endsWith(".ttf") ? "font/ttf" : "image/png";
    const { error } = await supabase.storage
      .from(ASSETS_BUCKET)
      .upload(`${STORAGE_ASSET_PREFIX}${rel}`, data, { contentType, upsert: true });
    if (error) throw new Error(`No se pudo subir ${rel}: ${error.message}`);
    bytes += data.byteLength;
    console.log(`  subido: ${rel}`);
  }
  console.log(`${FIXED_ASSET_PATHS.length} assets (${(bytes / 1024 / 1024).toFixed(1)} MB) en ${ASSETS_BUCKET}/${STORAGE_ASSET_PREFIX}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
