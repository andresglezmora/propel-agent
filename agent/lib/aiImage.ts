// Genera la foto de un espacio cuando el sitio de la escuela no tiene nada
// que sirva (PRD sección 7). Mismo endpoint y modelo que LandingPilot
// (agent/lib/image-gen.ts ahí): fetch directo al AI Gateway, no el SDK
// `generateImage` de "ai" — ya probado en producción con este exacto patrón.
const IMAGE_MODEL = "openai/gpt-image-2";

const SLOT_PROMPTS: Record<"cover" | "mission" | "centralized", string> = {
  cover:
    "Wide-format editorial photograph: students actively engaged in a real US school classroom or hallway, warm natural light, candid framing. This is the most prominent photo in the document, so it must read as a genuine, high-quality photograph, not a generic stock scene.",
  mission:
    "Editorial photograph: a teacher helping a small group of students at a table, warm and attentive, natural classroom light.",
  centralized:
    "Wide-format editorial photograph: a lively classroom scene, students collaborating, natural light, documentary style.",
};

export async function generateSlotImage(input: {
  schoolName: string;
  slot: "cover" | "mission" | "centralized";
}): Promise<{ bytes: Buffer } | { error: string }> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) return { error: "Falta AI_GATEWAY_API_KEY: no se puede generar una imagen." };

  // Regla fija (PRD sección 7, "Reglas de la imagen IA"): puede haber
  // personas, pero nadie reconocible en primer plano — nunca un retrato
  // posado que se lea como "este es un alumno real de la escuela".
  const prompt = [
    `Photograph for a student-recruitment proposal for "${input.schoolName}", a real United States school.`,
    SLOT_PROMPTS[input.slot],
    "Shot on a full-frame camera, natural 35-50mm lens, shallow depth of field, true-to-life color grading.",
    "No text, no logos, no watermarks.",
    "People may appear, but nobody identifiable in sharp close-up focus — groups, from behind, or at a middle distance only. Never a posed portrait implying a specific real student.",
  ].join(" ");

  let res: Response;
  try {
    res = await fetch("https://ai-gateway.vercel.sh/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: IMAGE_MODEL, prompt, n: 1, size: "1024x1024", quality: "high" }),
      signal: AbortSignal.timeout(150_000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      error: timedOut
        ? "El modelo de imagen no respondió en 150s."
        : `No se pudo llamar al modelo de imagen: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { error: `El modelo de imagen respondió ${res.status}: ${text.slice(0, 300)}` };
  }

  const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) return { error: "El modelo de imagen no devolvió datos." };
  return { bytes: Buffer.from(b64, "base64") };
}
