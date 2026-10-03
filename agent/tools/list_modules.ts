import { defineTool } from "eve/tools";
import { z } from "zod";
import { MODULES } from "../../react/modules/registry";
import { customModule } from "../../react/modules/custom";
import { allRecipes } from "#lib/plan";

export default defineTool({
  description:
    "Catálogo para armar variantes de propuesta: las recetas disponibles (listas ordenadas de módulos) y los módulos (páginas) con lo que contienen, cuántas páginas ocupan y, si piden contenido, qué datos o texto aceptan con sus límites. Úsalo antes de update_plan o set_module_content si no sabes qué existe.",
  inputSchema: z.object({}),
  label: { start: () => "Ver recetas y módulos" },
  async execute() {
    const recipes = await allRecipes();
    const custom = customModule("custom:ejemplo");
    return {
      recipes: Object.values(recipes).map((r) => ({ id: r.id, title: r.title, description: r.description, modules: r.modules })),
      modules: Object.values(MODULES).map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        pages: m.pages,
        photoSlots: m.photoSlots?.map((p) => p.slot) ?? [],
        content: m.content ? { required: m.content.required, guide: m.content.guide } : null,
      })),
      customPages: {
        id: "custom:<slug>  (slug en minúsculas con guiones; puede haber varias)",
        description: custom.description,
        content: { required: true, guide: custom.content!.guide },
      },
    };
  },
});
