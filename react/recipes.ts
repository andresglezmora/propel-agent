import { MODULES } from "./modules/registry";
import type { PhotoSlotId, PhotoSlotSpec } from "./modules/types";

// Una RECETA es una variante de propuesta: la lista ordenada de módulos que la
// forman. Son datos planos a propósito (ids, sin código) para que más adelante
// también puedan venir de la base de datos o de Scale, no solo de este archivo.
//
// Un PLAN es lo que se renderiza de verdad: arranca como copia de una receta y
// se puede ajustar para una propuesta concreta (agregar un módulo después de
// otro, quitar uno), por ejemplo cuando la instrucción dice dónde va una hoja.

export type Recipe = {
  id: string;
  title: string;
  description: string;
  modules: string[];
};

export type ProposalPlan = {
  recipe: string;
  modules: string[];
};

export const RECIPES: Record<string, Recipe> = {
  "full-service": {
    id: "full-service",
    title: "Full-Service",
    description: "La propuesta completa de TrustED Full-Service: 19 páginas, de la portada al acuerdo.",
    modules: [
      "cover",
      "mission",
      "partner",
      "centralized",
      "pricing",
      "lead-gen",
      "robust-crm",
      "parent-outreach",
      "data-dashboards",
      "marketing-design",
      "cmo-strategy",
      "cost-comparison",
      "testimonials",
      "agreement-cover",
      "agreement",
    ],
  },
};

export const DEFAULT_RECIPE = "full-service";

export function planFromRecipe(recipeId: string = DEFAULT_RECIPE): ProposalPlan {
  const recipe = RECIPES[recipeId];
  if (!recipe) throw new Error(`No existe la receta "${recipeId}". Opciones: ${Object.keys(RECIPES).join(", ")}.`);
  return { recipe: recipe.id, modules: [...recipe.modules] };
}

/** Inserta un módulo antes o después de otro que ya esté en el plan. */
export function insertModule(
  plan: ProposalPlan,
  moduleId: string,
  where: { after: string } | { before: string },
): ProposalPlan {
  const anchor = "after" in where ? where.after : where.before;
  const i = plan.modules.indexOf(anchor);
  if (i === -1) throw new Error(`El módulo "${anchor}" no está en el plan.`);
  const at = "after" in where ? i + 1 : i;
  const modules = [...plan.modules];
  modules.splice(at, 0, moduleId);
  return { ...plan, modules };
}

export function removeModule(plan: ProposalPlan, moduleId: string): ProposalPlan {
  return { ...plan, modules: plan.modules.filter((m) => m !== moduleId) };
}

/** Errores que impiden renderizar el plan. Vacío = válido. */
export function validatePlan(plan: ProposalPlan): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const id of plan.modules) {
    if (!MODULES[id]) errors.push(`Módulo desconocido: "${id}".`);
    if (seen.has(id)) errors.push(`Módulo repetido: "${id}".`);
    seen.add(id);
  }
  if (plan.modules.length === 0) errors.push("El plan no tiene módulos.");
  return errors;
}

/** Espacios de foto que necesita el plan, en el orden en que aparecen. */
export function photoSlotsFor(plan: ProposalPlan): PhotoSlotSpec[] {
  const out: PhotoSlotSpec[] = [];
  const seen = new Set<PhotoSlotId>();
  for (const id of plan.modules) {
    for (const spec of MODULES[id]?.photoSlots ?? []) {
      if (!seen.has(spec.slot)) {
        seen.add(spec.slot);
        out.push(spec);
      }
    }
  }
  return out;
}
