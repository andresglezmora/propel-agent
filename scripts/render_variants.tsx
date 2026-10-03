// Renderiza la propuesta de muestra (PROUD Academy) en red y en campus único.
// Sirve para comparar PDFs antes y después de un cambio en la plantilla:
//   npx tsx scripts/render_variants.tsx <carpeta de salida>
import fs from "node:fs/promises";
import path from "node:path";
import { renderProposalPdf, SAMPLE_PHOTOS } from "../react/buildProposal";

async function main() {
  const out = process.argv[2];
  if (!out) throw new Error("Uso: npx tsx scripts/render_variants.tsx <carpeta>");
  await fs.mkdir(out, { recursive: true });
  for (const campusMode of ["network", "single"] as const) {
    const bytes = await renderProposalPdf({
      schoolName: "PROUD Academy",
      schoolPossessive: "PROUD Academy's",
      date: "September 25, 2026",
      campusMode,
      photos: SAMPLE_PHOTOS,
    });
    const file = path.join(out, `${campusMode}.pdf`);
    await fs.writeFile(file, bytes);
    console.log(file, bytes.byteLength);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
