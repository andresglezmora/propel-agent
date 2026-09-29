// Script de desarrollo local: genera un PDF de muestra (PROUD Academy) sin
// pasar por Supabase ni por el agente. La tool real (agent/tools/render_proposal.ts)
// importa buildProposal.tsx directamente — este archivo es solo para
// iterar en el diseño con `npx tsx react/render.tsx`.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderProposalPdf, SAMPLE_PHOTOS } from "./buildProposal";
import fs from "node:fs/promises";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function main() {
  const bytes = await renderProposalPdf({
    schoolName: "PROUD Academy",
    schoolPossessive: "PROUD Academy's",
    date: "September 25, 2026",
    campusMode: "network",
    photos: SAMPLE_PHOTOS,
  });
  const outPath = path.join(ROOT, "template/full-service/react-preview.pdf");
  await fs.writeFile(outPath, bytes);
  console.log(`Escrito ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
