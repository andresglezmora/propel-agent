import { getModule } from "./modules/registry";
import type { PhotoSlotId, PhotoSlotSpec, ProposalContext, ProposalModule } from "./modules/types";

// Una RECETA es una variante de propuesta: la lista ordenada de módulos que la
// forman. Son datos planos a propósito (ids, sin código) para que también
// puedan venir de la base de datos (propel.recipes) o de Scale, no solo de
// este archivo.
//
// Un PLAN es lo que se renderiza de verdad: arranca como copia de una receta y
// se ajusta para una propuesta concreta (agregar un módulo después de otro,
// quitar uno), por ejemplo cuando la instrucción dice dónde va una hoja.

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

const FULL_SERVICE = [
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
];

export const RECIPES: Record<string, Recipe> = {
  "full-service": {
    id: "full-service",
    title: "Full-Service",
    description: "La propuesta completa de TrustED Full-Service: 19 páginas, de la portada al acuerdo.",
    modules: FULL_SERVICE,
  },
  "full-service-network": {
    id: "full-service-network",
    title: "Full-Service para una red",
    description:
      "Full-Service más las dos hojas de trato para redes (precios por número de campus, qué incluye, reportes de distrito y términos), después de la página de precios. Necesita los precios del trato.",
    modules: [...FULL_SERVICE.slice(0, 5), "network-pricing", "network-includes", ...FULL_SERVICE.slice(5)],
  },
};

export const DEFAULT_RECIPE = "full-service";

export function planFromRecipe(recipeId: string = DEFAULT_RECIPE, extra: Record<string, Recipe> = {}): ProposalPlan {
  const recipe = extra[recipeId] ?? RECIPES[recipeId];
  if (!recipe) {
    const all = [...Object.keys(RECIPES), ...Object.keys(extra)];
    throw new Error(`No existe la receta "${recipeId}". Opciones: ${all.join(", ")}.`);
  }
  return { recipe: recipe.id, modules: [...recipe.modules] };
}

/** Inserta un módulo antes o después de otro que ya esté en el plan, o al final. */
export function insertModule(
  plan: ProposalPlan,
  moduleId: string,
  where: { after: string } | { before: string } | "end",
): ProposalPlan {
  const modules = [...plan.modules];
  if (where === "end") {
    modules.push(moduleId);
    return { ...plan, modules };
  }
  const anchor = "after" in where ? where.after : where.before;
  const i = plan.modules.indexOf(anchor);
  if (i === -1) throw new Error(`El módulo "${anchor}" no está en el plan.`);
  modules.splice("after" in where ? i + 1 : i, 0, moduleId);
  return { ...plan, modules };
}

export function removeModule(plan: ProposalPlan, moduleId: string): ProposalPlan {
  if (!plan.modules.includes(moduleId)) throw new Error(`El módulo "${moduleId}" no está en el plan.`);
  return { ...plan, modules: plan.modules.filter((m) => m !== moduleId) };
}

/** Errores de estructura que impiden renderizar el plan. Vacío = válido. */
export function validatePlan(plan: ProposalPlan): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const id of plan.modules) {
    if (!getModule(id)) errors.push(`Módulo desconocido: "${id}".`);
    if (seen.has(id)) errors.push(`Módulo repetido: "${id}".`);
    seen.add(id);
  }
  if (plan.modules.length === 0) errors.push("El plan no tiene módulos.");
  // El contrato es una unidad: su portada va pegada al texto legal.
  const cover = plan.modules.indexOf("agreement-cover");
  const legal = plan.modules.indexOf("agreement");
  if (cover !== -1 && legal !== -1 && legal !== cover + 1) {
    errors.push('Nada puede ir entre "agreement-cover" y "agreement": "antes del contrato" es antes de "agreement-cover".');
  }
  return errors;
}

/** Espacios de foto que necesita el plan, en el orden en que aparecen. */
export function photoSlotsFor(plan: ProposalPlan): PhotoSlotSpec[] {
  const out: PhotoSlotSpec[] = [];
  const seen = new Set<PhotoSlotId>();
  for (const id of plan.modules) {
    for (const spec of getModule(id)?.photoSlots ?? []) {
      if (!seen.has(spec.slot)) {
        seen.add(spec.slot);
        out.push(spec);
      }
    }
  }
  return out;
}

export type ResolvedModule = { module: ProposalModule; content?: unknown };

/** Valida el contenido de cada módulo del plan y aplica sus defaults.
 * Devuelve los módulos listos para dibujar, o la lista de problemas. */
export function resolvePlan(
  plan: ProposalPlan,
  ctx: ProposalContext,
): { ok: true; modules: ResolvedModule[] } | { ok: false; errors: string[] } {
  const errors = validatePlan(plan);
  if (errors.length > 0) return { ok: false, errors };
  const modules: ResolvedModule[] = [];
  for (const id of plan.modules) {
    const module = getModule(id)!;
    const problem = module.check?.(ctx, plan.modules);
    if (problem) {
      errors.push(problem);
      continue;
    }
    if (!module.content) {
      modules.push({ module });
      continue;
    }
    const given = ctx.content?.[id];
    if (given === undefined && module.content.required) {
      errors.push(`"${id}" necesita contenido: ${module.content.guide}`);
      continue;
    }
    const parsed = module.content.schema.safeParse(given ?? {});
    if (!parsed.success) {
      const detail = parsed.error.issues.map((i) => `${i.path.join(".") || id}: ${i.message}`).join("; ");
      errors.push(`Contenido inválido en "${id}": ${detail}`);
      continue;
    }
    modules.push({ module, content: module.content.resolve(ctx, parsed.data) });
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, modules };
}
