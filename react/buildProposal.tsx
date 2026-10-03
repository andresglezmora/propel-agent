import { registerFonts } from "./fonts";
import { assetPath, ensureAssets } from "./assets";
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { MODULES } from "./modules/registry";
import { planFromRecipe, validatePlan, type ProposalPlan } from "./recipes";
import type { ProposalContext } from "./modules/types";

// El documento ya no es una lista fija de páginas: es un PLAN (receta +
// ajustes) que se recorre módulo por módulo. Sin plan explícito se usa la
// receta "full-service", que reproduce exactamente las 19 páginas de siempre.

export type ProposalInput = ProposalContext;

export function buildProposalDocument(input: ProposalInput, plan: ProposalPlan = planFromRecipe()) {
  const errors = validatePlan(plan);
  if (errors.length > 0) throw new Error(`Plan inválido: ${errors.join(" ")}`);
  return (
    <Document>
      {plan.modules.map((id) => (
        <React.Fragment key={id}>{MODULES[id]!.render(input)}</React.Fragment>
      ))}
    </Document>
  );
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
