import type React from "react";
import type { ImgSrc } from "../imgSrc";

// Un MÓDULO es una pieza de la propuesta: una página, o un bloque que ocupa
// varias (el acuerdo). Una RECETA es la lista ordenada de módulos que forma
// una propuesta (ver ../recipes.ts). Separar ambas cosas es lo que permite
// tener variantes (red, campus único, solo CRM…) sin duplicar páginas: cada
// variante es otra lista, no otra plantilla.

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
  date: string; // ya formateada: "September 25, 2026"
  campusMode: "single" | "network";
  photos: Record<PhotoSlotId, ImgSrc>;
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
  render: (ctx: ProposalContext) => React.ReactElement;
};
