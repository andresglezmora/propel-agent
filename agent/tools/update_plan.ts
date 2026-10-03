import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProposal, updateProposal, logEvent } from "#lib/db";
import { allRecipes, planFor } from "#lib/plan";
import { insertModule, planFromRecipe, removeModule, validatePlan, type ProposalPlan } from "../../react/recipes";
import { getModule } from "../../react/modules/registry";

export default defineTool({
  description:
    "Ajusta qué páginas lleva una propuesta y en qué orden. Acciones: use_recipe (cambia a otra receta y descarta ajustes), insert (agrega un módulo antes o después de otro, o al final; así se pone una hoja donde lo pida la instrucción), remove (quita un módulo), move (lo cambia de lugar). Para una página a la medida inserta \"custom:<slug>\" y luego dale contenido con set_module_content. Devuelve el orden final.",
  inputSchema: z.object({
    proposalId: z.string(),
    action: z.enum(["use_recipe", "insert", "remove", "move"]),
    recipe: z.string().optional().describe("Solo para use_recipe."),
    module: z.string().optional().describe('Id del módulo para insert, remove o move. Ej. "network-pricing" o "custom:onboarding".'),
    after: z.string().optional().describe("Insertar o mover justo después de este módulo."),
    before: z.string().optional().describe("Insertar o mover justo antes de este módulo."),
  }),
  label: { start: ({ action, module }) => `Ajustar páginas: ${action}${module ? ` ${module}` : ""}` },
  async execute({ proposalId, action, recipe, module, after, before }) {
    const proposal = await getProposal(proposalId);
    if (!proposal) return { error: `La propuesta ${proposalId} no existe.` };

    let plan: ProposalPlan;
    let recipeId = proposal.recipe;
    try {
      if (action === "use_recipe") {
        if (!recipe) return { error: "use_recipe necesita recipe." };
        plan = planFromRecipe(recipe, await allRecipes());
        recipeId = recipe;
      } else {
        if (!module) return { error: `${action} necesita module.` };
        if (action !== "remove" && !getModule(module)) {
          return { error: `No existe el módulo "${module}". Usa list_modules, o "custom:<slug>" para una página a la medida.` };
        }
        const current = await planFor(proposal);
        const where = after ? { after } : before ? { before } : ("end" as const);
        if (action === "insert") plan = insertModule(current, module, where);
        else if (action === "remove") plan = removeModule(current, module);
        else plan = insertModule(removeModule(current, module), module, where);
      }
    } catch (err) {
      return { error: (err as Error).message };
    }

    const errors = validatePlan(plan);
    if (errors.length > 0) return { error: errors.join(" ") };

    await updateProposal(proposalId, { recipe: recipeId, plan: action === "use_recipe" ? null : plan.modules });
    await logEvent(proposalId, "plan_updated", { action, module, recipe: recipeId, modules: plan.modules });

    const needsContent = plan.modules.filter((id) => {
      const m = getModule(id)!;
      return m.content?.required && !proposal.module_data?.[id];
    });
    return {
      recipe: recipeId,
      modules: plan.modules.map((id, i) => `${i + 1}. ${id} (${getModule(id)!.title})`),
      needsContent,
      note: needsContent.length
        ? `Antes de render_proposal falta contenido para: ${needsContent.join(", ")}. Usa set_module_content.`
        : "Listo para render_proposal.",
    };
  },
});
