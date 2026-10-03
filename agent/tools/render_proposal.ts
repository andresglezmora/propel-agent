import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  getProposal,
  getSelectedPhotos,
  nextVersionNumber,
  recordVersion,
  updateProposal,
  uploadToBucket,
  logEvent,
  downloadFromBucket,
} from "#lib/db";
import { renderProposalPdf, checkModulePages, countPdfPages } from "../../react/buildProposal";
import { photoSlotsFor, resolvePlan } from "../../react/recipes";
import type { PhotoSlotId, ProposalContext } from "../../react/modules/types";
import { aiAuthoredModules, contentFor, planFor } from "#lib/plan";
import { compressForPdf } from "#lib/compress";
import type { ImgSrc } from "../../react/imgSrc";

function formatDate(d: string) {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default defineTool({
  description:
    "Genera el PDF de la propuesta a partir de lo que ya está guardado: nombre, fecha, modo de campus, las fotos elegidas y el plan (receta y páginas extra, con su contenido). Falla si falta una foto, si un módulo necesita contenido que no tiene o si una hoja con contenido no cabe en su página: no renderiza con huecos. El resultado es la VISTA PREVIA: mándasela al equipo en el chat para que la revise antes de llamar a deliver_proposal, que es quien de verdad la entrega.",
  inputSchema: z.object({ proposalId: z.string() }),
  label: { start: () => "Generar el PDF" },
  async execute({ proposalId }) {
    const proposal = await getProposal(proposalId);
    if (!proposal) return { error: `La propuesta ${proposalId} no existe.` };

    // El plan sale de la propuesta (receta + ajustes). Las fotos que se piden
    // salen del plan: cada módulo declara sus espacios.
    const plan = await planFor(proposal);
    const slots = photoSlotsFor(plan).map((s) => s.slot);

    // Contenido primero (barato): sin esto no tiene caso bajar fotos.
    const dry: ProposalContext = {
      schoolName: proposal.school_name,
      schoolPossessive: proposal.school_possessive,
      schoolShort: proposal.school_short ?? undefined,
      date: formatDate(proposal.proposal_date),
      campusMode: proposal.campus_mode,
      photos: { cover: "", mission: "", centralized: "" },
      content: contentFor(proposal),
    };
    const resolved = resolvePlan(plan, dry);
    if (!resolved.ok) return { error: resolved.errors.join(" | ") };
    const overflow = await checkModulePages(dry, plan);
    if (overflow.length > 0) return { error: overflow.join(" ") };

    const photos = await getSelectedPhotos(proposalId);
    const missing = slots.filter((slot) => !photos[slot]?.storage_path);
    if (missing.length > 0) {
      return {
        error: `Faltan fotos para: ${missing.join(", ")}. Usa harvest_site_photos + set_slot_photo, o generate_ai_photo, antes de renderizar.`,
      };
    }

    await updateProposal(proposalId, { status: "rendering" });

    const downloaded = await Promise.all(
      slots.map(async (slot) => compressForPdf(slot, await downloadFromBucket(photos[slot]!.storage_path!))),
    );
    const photoBytes = Object.fromEntries(slots.map((slot, i) => [slot, downloaded[i]])) as Record<PhotoSlotId, ImgSrc>;

    let pdfBytes: Buffer;
    try {
      pdfBytes = await renderProposalPdf({ ...dry, photos: photoBytes }, plan);
    } catch (err) {
      await updateProposal(proposalId, { status: "failed", error: (err as Error).message });
      return { error: `Falló el render: ${(err as Error).message}` };
    }

    // 8 MB, no los 10 del original de Canva (PRD sección 10: "el archivo
    // pesa menos de 8 MB, con meta de 3 a 5 MB"). Bloquea la entrega si se
    // pasa — mejor eso que mandar un PDF que rebote en un correo.
    if (pdfBytes.byteLength > 8 * 1024 * 1024) {
      await updateProposal(proposalId, { status: "failed", error: "PDF > 8MB" });
      return { error: `El PDF pesa ${(pdfBytes.byteLength / 1024 / 1024).toFixed(1)}MB, más del máximo de 8MB.` };
    }

    const version = await nextVersionNumber(proposalId);
    const storagePath = `${proposalId}/v${version}.pdf`;
    await uploadToBucket(storagePath, pdfBytes, "application/pdf");
    await recordVersion({ proposalId, version, storagePath, sizeBytes: pdfBytes.byteLength });
    await updateProposal(proposalId, { status: "awaiting_approval" });
    const pages = countPdfPages(pdfBytes);
    await logEvent(proposalId, "rendered", { version, sizeBytes: pdfBytes.byteLength, pages, recipe: proposal.recipe, modules: plan.modules });
    const aiModules = aiAuthoredModules(proposal, plan);

    // Sin link en la respuesta a propósito: un URL firmado es un JWT de ~450
    // caracteres y el modelo lo re-escribe con errores ("Invalid Compact
    // JWS"). El canal manda el archivo solo, a partir de storagePath.
    return {
      version,
      sizeMB: Number((pdfBytes.byteLength / 1024 / 1024).toFixed(2)),
      storagePath,
      pages,
      recipe: proposal.recipe,
      modules: plan.modules,
      aiAuthoredModules: aiModules,
      note: [
        "El canal ya envió el PDF como archivo al chat: NO pegues ningún link. Resume (escuela, versión, páginas extra si las hay) y pregunta si hay cambios o si se aprueba.",
        aiModules.length
          ? `IMPORTANTE: di explícitamente que el texto de ${aiModules.join(", ")} lo propusiste tú y que deben revisarlo antes de aprobar.`
          : null,
        "Si piden un cambio de foto, usa set_slot_photo o generate_ai_photo; si piden un cambio de texto o de páginas, set_module_content o update_plan. Luego vuelve a llamar a esta tool: genera una versión nueva, no borra la anterior.",
      ]
        .filter(Boolean)
        .join(" "),
    };
  },
});
