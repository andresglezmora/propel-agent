// Renderiza propuestas de muestra (PROUD Academy y Noble Schools) para
// comparar PDFs antes y después de un cambio en la plantilla:
//   npx tsx scripts/render_variants.tsx <carpeta de salida>
//
//   network.pdf / single.pdf  receta full-service (deben salir idénticas
//                             entre versiones si no se tocó la plantilla)
//   noble.pdf                 receta full-service-network con los precios
//                             de la propuesta real de Noble Schools
//   deal-pages.pdf            solo las hojas de trato + una página a la medida
import fs from "node:fs/promises";
import path from "node:path";
import { renderProposalPdf, checkModulePages, countPdfPages, SAMPLE_PHOTOS, type ProposalInput } from "../react/buildProposal";
import { planFromRecipe, type ProposalPlan } from "../react/recipes";

const NOBLE_CONTENT = {
  "network-pricing": {
    tiers: [
      { campuses: 5, pricePerCampus: 2250 },
      { campuses: 10, pricePerCampus: 2000 },
      { campuses: 17, pricePerCampus: 1500, recommended: true },
    ],
  },
  "custom:onboarding": {
    title: "Your first",
    titleAccent: "90 days",
    intro: "A clear launch plan so every campus is live before the next enrollment window opens.",
    blocks: [
      { type: "section", label: "How we launch" },
      {
        type: "numbered",
        intro: "In the first 90 days we:",
        items: [
          "Audit each campus's current inquiry and application flow.",
          "Migrate family records into EnrollED CRM.",
          "Launch the first bilingual campaign per campus.",
          "Train school staff on follow-up and dashboards.",
        ],
      },
      { type: "callout", text: "By day 90 every campus has live campaigns, a working CRM, and a shared dashboard." },
    ],
  },
};

async function main() {
  const out = process.argv[2];
  if (!out) throw new Error("Uso: npx tsx scripts/render_variants.tsx <carpeta>");
  await fs.mkdir(out, { recursive: true });

  const write = async (name: string, input: ProposalInput, plan?: ProposalPlan) => {
    const bytes = await renderProposalPdf(input, plan);
    const file = path.join(out, name);
    await fs.writeFile(file, bytes);
    console.log(`${file}  ${countPdfPages(bytes)} páginas  ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB`);
  };

  for (const campusMode of ["network", "single"] as const) {
    await write(`${campusMode}.pdf`, {
      schoolName: "PROUD Academy",
      schoolPossessive: "PROUD Academy's",
      date: "September 25, 2026",
      campusMode,
      photos: SAMPLE_PHOTOS,
    });
  }

  const noble: ProposalInput = {
    schoolName: "Noble Schools",
    schoolPossessive: "Noble Schools'",
    schoolShort: "Noble",
    date: "October 3, 2026",
    campusMode: "network",
    photos: SAMPLE_PHOTOS,
    content: NOBLE_CONTENT,
  };
  await write("noble.pdf", noble, planFromRecipe("full-service-network"));

  const deal: ProposalPlan = { recipe: "custom", modules: ["network-pricing", "network-includes", "custom:onboarding"] };
  await write("deal-pages.pdf", noble, deal);
  const problems = await checkModulePages(noble, deal);
  console.log(problems.length ? `Desbordes: ${problems.join(" | ")}` : "Todas las hojas con contenido caben en su página.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
