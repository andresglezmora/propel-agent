// Genera versiones JPEG optimizadas de las imágenes fijas de la plantilla
// (capturas de producto y fotos de TrustED). Los PNG originales pesan unos
// 5 MB y dejaban el PDF base en 7.5 MB, a 0.5 MB del tope de 8: dos fotos de
// IA bastaban para pasarse. Todas se dibujan sobre fondo blanco, así que la
// transparencia se aplana a blanco sin cambio visible.
//
//   npx tsx scripts/optimize-assets.ts && npm run assets:upload
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "template/full-service/uploads";
const OUT = "template/full-service/optimized";

// Capturas con texto: más calidad. Fotos: un poco menos.
const FILES: Record<string, { quality: number; maxLongSide: number }> = {
  "img8.png": { quality: 88, maxLongSide: 1306 },
  "img9.png": { quality: 88, maxLongSide: 1306 },
  "img10.png": { quality: 88, maxLongSide: 1306 },
  "img11.png": { quality: 88, maxLongSide: 1000 },
  "img12.png": { quality: 88, maxLongSide: 1000 },
  "img13.png": { quality: 88, maxLongSide: 1000 },
  "img14.png": { quality: 84, maxLongSide: 1422 },
  "img15.png": { quality: 84, maxLongSide: 1286 },
  "img16.png": { quality: 84, maxLongSide: 1580 },
  "img17.png": { quality: 84, maxLongSide: 927 },
};

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  let before = 0;
  let after = 0;
  for (const [name, opts] of Object.entries(FILES)) {
    const input = await fs.readFile(path.join(SRC, name));
    const output = await sharp(input)
      .resize({ width: opts.maxLongSide, height: opts.maxLongSide, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: opts.quality, mozjpeg: true })
      .toBuffer();
    const dest = path.join(OUT, name.replace(/\.png$/, ".jpg"));
    await fs.writeFile(dest, output);
    before += input.byteLength;
    after += output.byteLength;
    console.log(`${dest}  ${(input.byteLength / 1024).toFixed(0)} KB -> ${(output.byteLength / 1024).toFixed(0)} KB`);
  }
  console.log(`Total: ${(before / 1024 / 1024).toFixed(2)} MB -> ${(after / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
