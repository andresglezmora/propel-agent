import type React from "react";
import type { z } from "zod";
import type { ImgSrc } from "../imgSrc";

// Un MÓDULO es una pieza de la propuesta: una página, o un bloque que ocupa
// varias (el acuerdo). Una RECETA es la lista ordenada de módulos que forma
// una propuesta (ver ../recipes.ts). Separar ambas cosas es lo que permite
// tener variantes (red, campus único, hojas extra de un trato) sin duplicar
// páginas: cada variante es otra lista, no otra plantilla.

/** Espacios de foto por escuela. Agregar uno nuevo también exige ampliar el
 * check de propel.proposal_photos.slot (db/migrations) y PhotoSlot en
 * agent/lib/db.ts. */
export type PhotoSlotId = "cover" | "mission" | "centralized";

export type PhotoSlotSpec = {
  slot: PhotoSlotId;
  /** Mínimo de resolución (lado largo, px) que pide la skill photo-selection. */
  minLongSide: number;
  description: string;
};

/** Lo que cambia por escuela y comparten todos los módulos. */
export type ProposalContext = {
  schoolName: string;
  schoolPossessive: string;
  /** Forma corta para el texto ("Noble" en vez de "Noble Schools"). */
  schoolShort?: string;
  date: string; // ya formateada: "September 25, 2026"
  campusMode: "single" | "network";
  photos: Record<PhotoSlotId, ImgSrc>;
  /** Contenido de los módulos que lo piden, por id de módulo (module_data). */
  content?: Record<string, unknown>;
};

/** Contenido que un módulo acepta: datos (precios, campus) o texto. */
export type ModuleContentSpec<D> = {
  /** Valida lo que llega del equipo o del modelo. Los límites de longitud
   * existen para que el texto quepa en la página. */
  schema: z.ZodType<D>;
  /** Contenido completo a partir de lo que llegó (con defaults aplicados).
   * Lanza si falta algo obligatorio que no tiene default. */
  resolve: (ctx: ProposalContext, given: D) => unknown;
  /** Explicación para el modelo: qué pedir, qué es obligatorio y los límites. */
  guide: string;
  /** true si sin contenido no se puede renderizar (p. ej. precios). */
  required: boolean;
};

export type ProposalModule = {
  id: string;
  /** Nombre corto para humanos y para el modelo ("Portada", "Precios"). */
  title: string;
  /** Qué contiene y cuándo tiene sentido incluirlo. */
  description: string;
  /** Páginas físicas que ocupa. null = variable (texto que fluye). */
  pages: number | null;
  photoSlots?: PhotoSlotSpec[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content?: ModuleContentSpec<any>;
  /** Validación que depende de otros módulos del plan (p. ej. el contrato
   * necesita saber qué precio de red usar). Devuelve el problema o null. */
  check?: (ctx: ProposalContext, planModules: string[]) => string | null;
  /** `content` llega ya resuelto (validado y con defaults). */
  render: (ctx: ProposalContext, content?: unknown) => React.ReactElement;
};
