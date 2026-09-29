/**
 * Variantes del nombre de la escuela (PRD sección 2: "El nombre necesita
 * variantes"). El posesivo en inglés de un nombre que ya termina en "s"
 * ("St. Mary's", "Williams Academies") se escribe solo con el apóstrofe, sin
 * una segunda "s" — la regla que cualquier reemplazo ingenuo de texto se
 * salta.
 */
export type SchoolNameVariants = {
  name: string;
  possessive: string;
  short: string | null;
};

export function deriveNameVariants(rawName: string, shortName?: string): SchoolNameVariants {
  const name = rawName.trim();
  const endsWithS = /s$/i.test(name);
  const possessive = endsWithS ? `${name}'` : `${name}'s`;
  return {
    name,
    possessive,
    short: shortName?.trim() || null,
  };
}

/** Nombre de archivo del entregable: "Proposal - {Escuela}.pdf" (sin caracteres que rompan un nombre de archivo). */
export function proposalFileName(schoolName: string, suffix = ""): string {
  const clean = schoolName.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim();
  return `Proposal - ${clean}${suffix}.pdf`;
}
