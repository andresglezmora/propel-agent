// Prueba de integración de las variantes contra el Supabase real: llama a las
// tools en el orden en que lo haría el agente (sin modelo de por medio), con
// una propuesta de prueba que se borra al final.
//
//   npx tsx --env-file=.env.local scripts/e2e_variants.ts <proposalId con 3 fotos> [carpeta para el PDF]
//
// El primer argumento es una propuesta existente de la que se reutilizan las
// 3 fotos ya subidas (no se vuelve a scrapear ni a generar nada).
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import startProposal from "../agent/tools/start_proposal";
import listModules from "../agent/tools/list_modules";
import updatePlan from "../agent/tools/update_plan";
import setModuleContent from "../agent/tools/set_module_content";
import renderProposal from "../agent/tools/render_proposal";
import { db, PROPOSALS_BUCKET } from "../agent/lib/supabase";
import { getSelectedPhotos, recordPhoto, downloadFromBucket } from "../agent/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = { session: { id: "e2e", auth: { initiator: null, current: { principalId: "e2e" } } } } as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const run = async (tool: any, input: unknown) => (await tool.execute(input, ctx)) as any;

async function main() {
  const [photoSource, outDir] = process.argv.slice(2);
  if (!photoSource) throw new Error("Falta el proposalId del que se toman las fotos.");

  let proposalId: string | undefined;
  try {
    // 1. Propuesta con la receta de red
    const created = await run(startProposal, {
      schoolName: "Noble Schools (E2E)",
      schoolShort: "Noble",
      websiteUrl: "nobleschools.org",
      campusMode: "network",
      recipe: "full-service-network",
      requestedBy: "e2e",
    });
    assert.ok(created.proposalId, JSON.stringify(created));
    proposalId = created.proposalId as string;
    assert.equal(created.recipe, "full-service-network");
    console.log("1. start_proposal ok", proposalId);

    const unknownRecipe = await run(startProposal, { schoolName: "X", websiteUrl: "x.org", campusMode: "single", recipe: "nope" });
    assert.match(unknownRecipe.error, /No existe la receta/);

    // 2. Catálogo
    const catalog = await run(listModules, {});
    assert.ok(catalog.recipes.some((r: { id: string }) => r.id === "full-service-network"));
    assert.ok(catalog.modules.some((m: { id: string }) => m.id === "network-pricing"));
    console.log(`2. list_modules ok (${catalog.recipes.length} recetas, ${catalog.modules.length} módulos)`);

    // 3. Render sin precios: debe pedirlos
    const noPrices = await run(renderProposal, { proposalId });
    assert.match(noPrices.error, /network-pricing.*necesita contenido/);
    console.log("3. render sin precios bloqueado ok");

    // 4. Contenido inválido y válido
    const twoRecommended = await run(setModuleContent, {
      proposalId,
      module: "network-pricing",
      source: "team",
      content: { tiers: [{ campuses: 5, pricePerCampus: 2250, recommended: true }, { campuses: 17, pricePerCampus: 1500, recommended: true }] },
    });
    assert.match(twoRecommended.error, /Solo una opción/);
    const prices = await run(setModuleContent, {
      proposalId,
      module: "network-pricing",
      source: "team",
      content: {
        tiers: [
          { campuses: 5, pricePerCampus: 2250 },
          { campuses: 10, pricePerCampus: 2000 },
          { campuses: 17, pricePerCampus: 1500, recommended: true },
        ],
      },
    });
    assert.equal(prices.source, "team", JSON.stringify(prices));
    console.log("4. set_module_content precios ok (e inválido rechazado)");

    // 5. Página a la medida antes del acuerdo, con texto "propuesto por IA"
    const inserted = await run(updatePlan, { proposalId, action: "insert", module: "custom:onboarding", before: "agreement-cover" });
    assert.deepEqual(inserted.needsContent, ["custom:onboarding"], JSON.stringify(inserted));
    const tooLong = await run(setModuleContent, {
      proposalId,
      module: "custom:onboarding",
      source: "ai",
      content: {
        title: "Your first",
        blocks: Array.from({ length: 8 }, () => ({ type: "panel", title: "Phase", body: "x ".repeat(160).trim(), footer: "y ".repeat(85).trim() })),
      },
    });
    assert.match(tooLong.error, /ocupa \d+ páginas/, JSON.stringify(tooLong).slice(0, 300));
    const custom = await run(setModuleContent, {
      proposalId,
      module: "custom:onboarding",
      source: "ai",
      replace: true,
      content: {
        title: "Your first",
        titleAccent: "90 days",
        intro: "A clear launch plan so every campus is live before the next enrollment window opens.",
        blocks: [
          { type: "section", label: "How we launch" },
          { type: "numbered", items: ["Audit each campus's inquiry flow.", "Migrate family records into EnrollED CRM.", "Launch the first bilingual campaign per campus.", "Train school staff on follow-up and dashboards."] },
          { type: "callout", text: "By day 90 every campus has live campaigns, a working CRM, and a shared dashboard." },
        ],
      },
    });
    assert.equal(custom.inPlan, true, JSON.stringify(custom));
    console.log("5. update_plan + página a la medida ok (desborde rechazado)");

    // 6. Mover las hojas de red al final de los pilares
    const moved = await run(updatePlan, { proposalId, action: "move", module: "network-includes", after: "cost-comparison" });
    assert.ok(moved.modules.findIndex((m: string) => m.includes("network-includes")) > moved.modules.findIndex((m: string) => m.includes("cost-comparison")));
    console.log("6. update_plan move ok");

    // 7. Fotos reutilizadas y render final
    const photos = await getSelectedPhotos(photoSource);
    for (const slot of ["cover", "mission", "centralized"] as const) {
      const p = photos[slot];
      assert.ok(p?.storage_path, `La propuesta ${photoSource} no tiene foto en ${slot}.`);
      await recordPhoto({ proposalId, slot, source: "site", storagePath: p.storage_path! });
    }
    const rendered = await run(renderProposal, { proposalId });
    assert.ok(rendered.version, JSON.stringify(rendered));
    assert.equal(rendered.pages, 22, `Se esperaban 22 páginas (19 + 2 de red + 1 a la medida), salieron ${rendered.pages}`);
    assert.deepEqual(rendered.aiAuthoredModules, ["custom:onboarding"]);
    console.log(`7. render_proposal ok: v${rendered.version}, ${rendered.pages} páginas, ${rendered.sizeMB} MB, IA en ${rendered.aiAuthoredModules}`);

    if (outDir) {
      const file = path.join(outDir, "e2e-noble.pdf");
      await fs.writeFile(file, await downloadFromBucket(rendered.storagePath));
      console.log("   PDF:", file);
    }
    console.log("\nTodo ok.");
  } finally {
    if (proposalId) {
      const { data: files } = await db().storage.from(PROPOSALS_BUCKET).list(proposalId);
      if (files?.length) await db().storage.from(PROPOSALS_BUCKET).remove(files.map((f) => `${proposalId}/${f.name}`));
      await db().from("proposals").delete().eq("id", proposalId);
      console.log("Limpieza: propuesta de prueba borrada.");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
