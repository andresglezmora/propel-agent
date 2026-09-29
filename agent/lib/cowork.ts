import { signedUrlFor } from "./db";

// Lado saliente hacia el canal de Scale CRM (trusted-scale): Propel responde
// dentro del hilo donde le escribieron.
//
//   POST {PROPEL_SCALE_WEBHOOK_URL}
//   Authorization: Bearer <PROPEL_STATUS_WEBHOOK_SECRET>
//   { threadId, kind: "message", text, attachments?: [{ fileName, url, mimeType }] }
//   { threadId, kind: "typing" }   // «Propel está escribiendo…», opcional
//
// Best-effort con 3 intentos cortos: un mensaje que no llega no pierde trabajo
// real (la propuesta sigue en Storage y se puede pedir de nuevo en el hilo).

const DEFAULT_URL = "https://whyknlzvzwyoxbgpkksl.supabase.co/functions/v1/propel-webhook";

export type CoworkAttachment = { fileName: string; url: string; mimeType: string };

async function post(body: Record<string, unknown>): Promise<void> {
  const secret = process.env.PROPEL_STATUS_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[cowork] Falta PROPEL_STATUS_WEBHOOK_SECRET: no se responde en Scale.");
    return;
  }
  const url = process.env.PROPEL_SCALE_WEBHOOK_URL ?? DEFAULT_URL;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok || res.status === 404) return; // 404 = el hilo ya no existe en Scale
      console.warn(`[cowork] intento ${attempt}/3: respondió ${res.status}`);
    } catch (error) {
      console.warn(`[cowork] intento ${attempt}/3 falló: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000));
  }
}

/** Nunca lanza: una falla de Scale no debe tumbar la generación real. */
export async function sendToScale(threadId: string, text: string, attachments?: CoworkAttachment[]): Promise<void> {
  await post({ threadId, kind: "message", text, attachments }).catch(() => {});
}

export async function typingInScale(threadId: string): Promise<void> {
  await post({ threadId, kind: "typing" }).catch(() => {});
}

/** Adjunto PDF con link firmado (24 h): Scale lo descarga y lo guarda en su propio storage. */
export async function pdfAttachment(storagePath: string, fileName: string): Promise<CoworkAttachment> {
  return { fileName, url: await signedUrlFor(storagePath, 60 * 60 * 24, fileName), mimeType: "application/pdf" };
}
