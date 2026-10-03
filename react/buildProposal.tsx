import { registerFonts } from "./fonts";
import { assetPath, ensureAssets } from "./assets";
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { planFromRecipe, resolvePlan, type ProposalPlan, type ResolvedModule } from "./recipes";
import type { ProposalContext } from "./modules/types";

// El documento no es una lista fija de páginas: es un PLAN (receta + ajustes)
// que se recorre módulo por módulo. Sin plan explícito se usa la receta
// "full-service", que reproduce exactamente las 19 páginas de siempre.

export type ProposalInput = ProposalContext;

function documentFor(input: ProposalInput, modules: ResolvedModule[]) {
  return (
    <Document>
      {modules.map(({ module, content }) => (
        <React.Fragment key={module.id}>{module.render(input, content)}</React.Fragment>
      ))}
    </Document>
  );
}

function resolveOrThrow(input: ProposalInput, plan: ProposalPlan): ResolvedModule[] {
  const resolved = resolvePlan(plan, input);
  if (!resolved.ok) throw new Error(`No se puede armar la propuesta: ${resolved.errors.join(" | ")}`);
  return resolved.modules;
}

export function buildProposalDocument(input: ProposalInput, plan: ProposalPlan = planFromRecipe()) {
  return documentFor(input, resolveOrThrow(input, plan));
}

/** Cuenta las páginas de un PDF ya generado. */
export function countPdfPages(pdf: Buffer): number {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

/** Los módulos con contenido (datos o texto que cambia) se renderizan solos
 * para comprobar que ocupan las páginas que declaran: un texto más largo de
 * la cuenta haría que la hoja se parta en dos. */
export async function checkModulePages(input: ProposalInput, plan: ProposalPlan): Promise<string[]> {
  await ensureAssets();
  registerFonts();
  const problems: string[] = [];
  for (const rm of resolveOrThrow(input, plan)) {
    if (!rm.module.content || rm.module.pages === null) continue;
    const pages = countPdfPages(await renderToBuffer(documentFor(input, [rm])));
    if (pages !== rm.module.pages) {
      problems.push(
        `"${rm.module.id}" ocupa ${pages} páginas y debe ocupar ${rm.module.pages}: acorta el texto o quita un bloque.`,
      );
    }
  }
  return problems;
}

export async function renderProposalPdf(input: ProposalInput, plan?: ProposalPlan): Promise<Buffer> {
  // En Vercel los assets fijos (fuentes, logos, capturas) no vienen en el
  // bundle: se bajan de Storage a /tmp la primera vez (ver assets.ts).
  await ensureAssets();
  registerFonts();
  return renderToBuffer(buildProposalDocument(input, plan));
}

/** Fotos de referencia (PROUD Academy) para pruebas locales sin depender de un
 * scraping o una generación real: las usan react/render.tsx y
 * scripts/render_variants.tsx. */
export const SAMPLE_PHOTOS = {
  cover: assetPath("template/full-service/assets/img_934_duotone.png"),
  mission: assetPath("template/full-service/assets/img_968.png"),
  centralized: assetPath("template/full-service/assets/img_102.png"),
};
