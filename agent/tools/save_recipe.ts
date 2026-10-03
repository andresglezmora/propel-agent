import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProposal, saveRecipe, logEvent } from "#lib/db";
import { planFor } from "#lib/plan";
import { RECIPES } from "../../react/recipes";

export default defineTool({
  description:
    "Guarda el orden de páginas de una propuesta como receta reutilizable, para usarla después con start_proposal o update_plan. Úsalo solo cuando el equipo lo pida (\"guarda esta variante\"). Guarda qué módulos y en qué orden, no el contenido de cada trato.",
  inputSchema: z.object({
    proposalId: z.string(),
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,48}$/).describe('Id corto en minúsculas con guiones, ej. "full-service-renewal".'),
    title: z.string().min(3).max(60),
    description: z.string().max(240).describe("Para qué sirve y cuándo usarla."),
  }),
  label: { start: ({ id }) => `Guardar receta ${id}` },
  async execute({ proposalId, id, title, description }, ctx) {
    if (RECIPES[id]) return { error: `"${id}" es una receta del código y no se puede sobrescribir. Usa otro id.` };
    const proposal = await getProposal(proposalId);
    if (!proposal) return { error: `La propuesta ${proposalId} no existe.` };
    const plan = await planFor(proposal);
    const createdBy = ctx.session.auth.current?.principalId;
    await saveRecipe({ id, title, description, modules: plan.modules, createdBy });
    await logEvent(proposalId, "recipe_saved", { id, modules: plan.modules });
    return { id, title, modules: plan.modules };
  },
});
