import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProposal, updateProposal, logEvent, type ModuleEntry } from "#lib/db";
import { contentFor, planFor } from "#lib/plan";
import { getModule } from "../../react/modules/registry";
import { checkModulePages } from "../../react/buildProposal";
import type { ProposalContext } from "../../react/modules/types";

export default defineTool({
  description:
    "Guarda los datos o el texto de un módulo que los pide (precios de red, razones, páginas a la medida). Valida contra los límites del módulo (list_modules los muestra) y comprueba que la hoja quepa en su página. source=\"team\" si el texto lo dio el equipo tal cual; source=\"ai\" si lo redactaste tú. Las cifras (precios, número de campus) siempre vienen del equipo, nunca las inventes. Por defecto mezcla con lo que ya había (merge); replace:true lo reemplaza completo.",
  inputSchema: z.object({
    proposalId: z.string(),
    module: z.string().describe('Id del módulo, ej. "network-pricing" o "custom:onboarding".'),
    content: z.record(z.string(), z.unknown()).describe("Campos del módulo. Ver la guía en list_modules."),
    source: z.enum(["team", "ai"]),
    replace: z.boolean().optional(),
  }),
  label: { start: ({ module }) => `Guardar contenido de ${module}` },
  async execute({ proposalId, module, content, source, replace }) {
    const proposal = await getProposal(proposalId);
    if (!proposal) return { error: `La propuesta ${proposalId} no existe.` };

    const spec = getModule(module);
    if (!spec) return { error: `No existe el módulo "${module}". Usa list_modules.` };
    if (!spec.content) return { error: `"${module}" no acepta contenido: su texto es fijo.` };

    const plan = await planFor(proposal);
    const inPlan = plan.modules.includes(module);

    const previous = proposal.module_data?.[module]?.content ?? {};
    const merged = replace ? content : { ...previous, ...content };
    const parsed = spec.content.schema.safeParse(merged);
    if (!parsed.success) {
      return {
        error: `Contenido inválido: ${parsed.error.issues.map((i) => `${i.path.join(".") || module}: ${i.message}`).join("; ")}`,
        guide: spec.content.guide,
      };
    }

    // Comprobación de que la hoja cabe, renderizándola sola. Las hojas con
    // contenido no usan fotos de la escuela, así que no hace falta bajarlas.
    const ctx: ProposalContext = {
      schoolName: proposal.school_name,
      schoolPossessive: proposal.school_possessive,
      schoolShort: proposal.school_short ?? undefined,
      date: proposal.proposal_date,
      campusMode: proposal.campus_mode,
      photos: { cover: "", mission: "", centralized: "" },
      content: { ...contentFor(proposal), [module]: merged },
    };
    const problems = await checkModulePages(ctx, { recipe: proposal.recipe, modules: [module] });
    if (problems.length > 0) return { error: problems.join(" "), guide: spec.content.guide };

    const entry: ModuleEntry = { content: merged, source, updatedAt: new Date().toISOString() };
    // Si el equipo corrige un texto propuesto por la IA, el módulo pasa a "team"
    // solo cuando lo reemplaza completo; una mezcla conserva la marca de IA.
    if (!replace && source === "team" && proposal.module_data?.[module]?.source === "ai") entry.source = "ai";
    await updateProposal(proposalId, { module_data: { ...(proposal.module_data ?? {}), [module]: entry } });
    await logEvent(proposalId, "module_content_set", { module, source: entry.source, fields: Object.keys(content) });

    return {
      module,
      source: entry.source,
      savedFields: Object.keys(merged),
      inPlan,
      note: inPlan
        ? "Guardado. Vuelve a llamar a render_proposal para ver la hoja."
        : `Guardado, pero "${module}" no está en el plan: agrégalo con update_plan (action insert) donde lo pida la instrucción.`,
    };
  },
});
