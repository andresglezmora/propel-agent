import { db, PROPOSALS_BUCKET } from "./supabase";
import { deriveNameVariants } from "./names";

export type CampusMode = "single" | "network";
export type ProposalStatus = "draft" | "harvesting" | "awaiting_approval" | "rendering" | "delivered" | "failed";
export type PhotoSlot = "cover" | "mission" | "centralized";
export type PhotoSource = "site" | "ai" | "upload";

/** Contenido de un módulo guardado en proposals.module_data, con su origen:
 * "team" = lo dio el equipo tal cual; "ai" = lo propuso el modelo y hay que
 * decirlo al mandar la vista previa. */
export type ModuleEntry = { content: Record<string, unknown>; source: "team" | "ai"; updatedAt: string };

export type SavedRecipe = { id: string; title: string; description: string; modules: string[] };

export type Proposal = {
  id: string;
  school_name: string;
  school_possessive: string;
  school_short: string | null;
  website_url: string;
  campus_mode: CampusMode;
  proposal_date: string;
  status: ProposalStatus;
  approved_version: number | null;
  ai_images_used: number;
  requested_by: string | null;
  telegram_chat_id: string | null;
  cowork_thread_id: string | null;
  recipe: string;
  plan: string[] | null;
  module_data: Record<string, ModuleEntry>;
  error: string | null;
};

export async function createProposal(input: {
  schoolName: string;
  schoolShort?: string;
  websiteUrl: string;
  campusMode: CampusMode;
  requestedBy?: string;
  telegramChatId?: string;
  coworkThreadId?: string;
  recipe?: string;
}): Promise<Proposal> {
  const variants = deriveNameVariants(input.schoolName, input.schoolShort);
  const { data, error } = await db()
    .from("proposals")
    .insert({
      school_name: variants.name,
      school_possessive: variants.possessive,
      school_short: variants.short,
      website_url: input.websiteUrl,
      campus_mode: input.campusMode,
      requested_by: input.requestedBy,
      telegram_chat_id: input.telegramChatId,
      cowork_thread_id: input.coworkThreadId,
      recipe: input.recipe ?? "full-service",
      status: "draft",
    })
    .select()
    .single();
  if (error) throw new Error(`No se pudo crear la propuesta: ${error.message}`);
  return data as Proposal;
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const { data, error } = await db().from("proposals").select().eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo leer la propuesta ${id}: ${error.message}`);
  return data as Proposal | null;
}

export async function updateProposal(id: string, patch: Partial<Proposal>): Promise<Proposal> {
  const { data, error } = await db()
    .from("proposals")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`No se pudo actualizar la propuesta ${id}: ${error.message}`);
  return data as Proposal;
}

export async function listRecentProposals(limit = 10): Promise<Proposal[]> {
  const { data, error } = await db()
    .from("proposals")
    .select()
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`No se pudo listar propuestas: ${error.message}`);
  return (data ?? []) as Proposal[];
}

export async function logEvent(proposalId: string, type: string, payload?: Record<string, unknown>) {
  const { error } = await db().from("proposal_events").insert({ proposal_id: proposalId, type, payload });
  if (error) throw new Error(`No se pudo registrar el evento ${type}: ${error.message}`);
}

// ---- fotos --------------------------------------------------------------

export async function recordPhoto(input: {
  proposalId: string;
  slot: PhotoSlot;
  source: PhotoSource;
  sourceUrl?: string;
  storagePath?: string;
  width?: number;
  height?: number;
}) {
  // Solo una foto "seleccionada" por slot: cualquier selección anterior para
  // este slot se desmarca antes de insertar la nueva, para no tener que
  // andar filtrando por fecha en cada lectura.
  await db()
    .from("proposal_photos")
    .update({ selected: false })
    .eq("proposal_id", input.proposalId)
    .eq("slot", input.slot);

  const { data, error } = await db()
    .from("proposal_photos")
    .insert({
      proposal_id: input.proposalId,
      slot: input.slot,
      source: input.source,
      source_url: input.sourceUrl,
      storage_path: input.storagePath,
      width: input.width,
      height: input.height,
      selected: true,
    })
    .select()
    .single();
  if (error) throw new Error(`No se pudo registrar la foto de ${input.slot}: ${error.message}`);
  return data;
}

export async function getSelectedPhotos(proposalId: string) {
  const { data, error } = await db()
    .from("proposal_photos")
    .select()
    .eq("proposal_id", proposalId)
    .eq("selected", true);
  if (error) throw new Error(`No se pudieron leer las fotos de la propuesta ${proposalId}: ${error.message}`);
  const bySlot: Partial<Record<PhotoSlot, (typeof data)[number]>> = {};
  for (const row of data ?? []) bySlot[row.slot as PhotoSlot] = row;
  return bySlot;
}

export async function countAiImages(proposalId: string): Promise<number> {
  const proposal = await getProposal(proposalId);
  return proposal?.ai_images_used ?? 0;
}

export async function incrementAiImages(proposalId: string) {
  const proposal = await getProposal(proposalId);
  if (!proposal) throw new Error(`Propuesta ${proposalId} no existe`);
  return updateProposal(proposalId, { ai_images_used: (proposal.ai_images_used ?? 0) + 1 });
}

// ---- versiones del PDF ----------------------------------------------------

export async function recordVersion(input: {
  proposalId: string;
  version: number;
  storagePath: string;
  sizeBytes: number;
}) {
  const { error } = await db().from("proposal_versions").insert({
    proposal_id: input.proposalId,
    version: input.version,
    storage_path: input.storagePath,
    size_bytes: input.sizeBytes,
  });
  if (error) throw new Error(`No se pudo registrar la versión ${input.version}: ${error.message}`);
}

export async function nextVersionNumber(proposalId: string): Promise<number> {
  const { data, error } = await db()
    .from("proposal_versions")
    .select("version")
    .eq("proposal_id", proposalId)
    .order("version", { ascending: false })
    .limit(1);
  if (error) throw new Error(`No se pudo calcular la siguiente versión: ${error.message}`);
  return ((data?.[0]?.version as number | undefined) ?? 0) + 1;
}

export async function getLatestVersion(proposalId: string) {
  const { data, error } = await db()
    .from("proposal_versions")
    .select()
    .eq("proposal_id", proposalId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer la última versión: ${error.message}`);
  return data;
}

// ---- storage ---------------------------------------------------------------

export async function uploadToBucket(path: string, bytes: Buffer, contentType: string) {
  const { error } = await db().storage.from(PROPOSALS_BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`No se pudo subir ${path} a Storage: ${error.message}`);
}

export async function downloadFromBucket(path: string): Promise<Buffer> {
  const { data, error } = await db().storage.from(PROPOSALS_BUCKET).download(path);
  if (error) throw new Error(`No se pudo bajar ${path} de Storage: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

/** `downloadAs`: nombre con el que el navegador guarda el archivo (Content-Disposition). */
export async function signedUrlFor(
  path: string,
  expiresInSeconds = 60 * 60 * 24 * 30,
  downloadAs?: string,
): Promise<string> {
  const { data, error } = await db()
    .storage.from(PROPOSALS_BUCKET)
    .createSignedUrl(path, expiresInSeconds, downloadAs ? { download: downloadAs } : undefined);
  if (error) throw new Error(`No se pudo firmar la URL de ${path}: ${error.message}`);
  return data.signedUrl;
}

export async function getProposalByCoworkThread(threadId: string): Promise<Proposal | null> {
  const { data, error } = await db()
    .from("proposals")
    .select()
    .eq("cowork_thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer la propuesta del hilo ${threadId}: ${error.message}`);
  return data as Proposal | null;
}

/** true si el mensaje es nuevo; false si Scale lo reintentó y ya se procesó. */
export async function claimInboundMessage(messageId: string, threadId: string): Promise<boolean> {
  const { error } = await db().from("inbound_messages").insert({ message_id: messageId, thread_id: threadId });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(`No se pudo registrar el mensaje ${messageId}: ${error.message}`);
}

// ---- recetas guardadas (propel.recipes) ----------------------------------

export async function listSavedRecipes(): Promise<SavedRecipe[]> {
  const { data, error } = await db().from("recipes").select("id, title, description, modules").order("id");
  if (error) throw new Error(`No se pudieron leer las recetas guardadas: ${error.message}`);
  return (data ?? []) as SavedRecipe[];
}

export async function saveRecipe(recipe: SavedRecipe & { createdBy?: string }): Promise<void> {
  const { error } = await db()
    .from("recipes")
    .upsert({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      modules: recipe.modules,
      created_by: recipe.createdBy,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(`No se pudo guardar la receta ${recipe.id}: ${error.message}`);
}
