import { RECIPES, planFromRecipe, type ProposalPlan, type Recipe } from "../../react/recipes";
import { listSavedRecipes, type Proposal } from "./db";

// Puente entre lo que está guardado en una propuesta (receta, plan ajustado y
// contenido de módulos) y lo que necesita la plantilla. Todas las tools pasan
// por aquí para que el plan se arme igual en todas partes.

/** Recetas del código más las guardadas por el equipo (propel.recipes). Si
 * un id existe en ambos lados, gana el del código. */
export async function allRecipes(): Promise<Record<string, Recipe>> {
  const saved = await listSavedRecipes();
  const out: Record<string, Recipe> = {};
  for (const r of saved) out[r.id] = r;
  return { ...out, ...RECIPES };
}

export async function planFor(proposal: Proposal): Promise<ProposalPlan> {
  if (proposal.plan && proposal.plan.length > 0) return { recipe: proposal.recipe, modules: proposal.plan };
  return planFromRecipe(proposal.recipe, await allRecipes());
}

/** module_data guarda { content, source } por módulo; la plantilla solo
 * necesita el contenido. */
export function contentFor(proposal: Proposal): Record<string, unknown> {
  return Object.fromEntries(Object.entries(proposal.module_data ?? {}).map(([id, entry]) => [id, entry.content]));
}

/** Módulos cuyo texto propuso el modelo: se avisan al mandar la vista previa. */
export function aiAuthoredModules(proposal: Proposal, plan: ProposalPlan): string[] {
  return plan.modules.filter((id) => proposal.module_data?.[id]?.source === "ai");
}
