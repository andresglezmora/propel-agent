import React from "react";
import { z } from "zod";
import {
  DealPage,
  PageTitle,
  Intro,
  SectionLabel,
  PriceCards,
  Paragraphs,
  NumberedList,
  Callout,
  IconCards,
  DarkPanel,
  TermCards,
  ICON_NAMES,
  type IconName,
} from "../blocks";
import { money, accentNotRepeated, ACCENT_MESSAGE } from "./network";
import type { ProposalContext, ProposalModule } from "./types";

// Página A LA MEDIDA: para contenido de un trato que no cabe en ningún módulo
// fijo. No se diseña nada nuevo: la página es una lista de bloques del mismo
// sistema visual (los de las hojas de Noble), cada uno con límites de texto.
// El id en el plan es "custom:<slug>" y su contenido vive en
// module_data["custom:<slug>"]. Puede haber varias en una propuesta.

export const CUSTOM_PREFIX = "custom:";
export const isCustomId = (id: string) => /^custom:[a-z0-9][a-z0-9-]{0,39}$/.test(id);

const t = (max: number) => z.string().trim().min(1).max(max);
const iconName = z.enum(ICON_NAMES as [IconName, ...IconName[]]);

const block = z.discriminatedUnion("type", [
  z.object({ type: z.literal("section"), label: t(52) }),
  z.object({ type: z.literal("paragraphs"), columns: z.array(z.object({ lead: t(75).optional(), text: t(320) })).min(1).max(2) }),
  z.object({ type: z.literal("numbered"), intro: t(40).optional(), items: z.array(t(95)).min(2).max(6) }),
  z.object({ type: z.literal("cards"), items: z.array(z.object({ icon: iconName, label: t(60) })).min(2).max(8) }),
  z.object({
    type: z.literal("panel"),
    icon: iconName.optional(),
    title: t(40),
    body: t(330),
    tiles: z.array(z.object({ icon: iconName, label: t(24) })).min(2).max(4).optional(),
    footer: t(180).optional(),
  }),
  z.object({ type: z.literal("callout"), text: t(160) }),
  z.object({ type: z.literal("terms"), items: z.array(z.object({ icon: iconName, lead: t(60), body: t(360) })).min(1).max(2) }),
  z.object({
    type: z.literal("prices"),
    tiers: z
      .array(
        z.object({
          label: t(28),
          amount: z.number().positive(),
          unit: t(20).optional(),
          quantity: z.number().int().positive().optional(),
          totalLabel: t(30).optional(),
          recommended: z.boolean().optional(),
        }),
      )
      .min(1)
      .max(3),
    note: t(120).optional(),
  }),
]);

const customSchema = z.object({
  eyebrow: t(40).optional(),
  title: t(34),
  titleAccent: t(18).optional(),
  intro: t(230).optional(),
  blocks: z.array(block).min(1).max(8),
}).refine(accentNotRepeated, { message: ACCENT_MESSAGE });

type CustomInput = z.infer<typeof customSchema>;
type Block = z.infer<typeof block>;

function renderBlock(b: Block, i: number) {
  switch (b.type) {
    case "section":
      return <SectionLabel key={i} label={b.label} />;
    case "paragraphs":
      return <Paragraphs key={i} columns={b.columns} />;
    case "numbered":
      return <NumberedList key={i} intro={b.intro} items={b.items} />;
    case "cards":
      return <IconCards key={i} items={b.items as { icon: IconName; label: string }[]} />;
    case "panel":
      return (
        <DarkPanel
          key={i}
          icon={b.icon as IconName | undefined}
          title={b.title}
          body={b.body}
          tiles={b.tiles as { icon: IconName; label: string }[] | undefined}
          footer={b.footer}
        />
      );
    case "callout":
      return <Callout key={i} text={b.text} />;
    case "terms":
      return <TermCards key={i} items={b.items as { icon: IconName; lead: string; body: string }[]} />;
    case "prices":
      return (
        <PriceCards
          key={i}
          tiers={b.tiers.map((x) => ({
            label: x.label,
            price: money(x.amount),
            unit: x.unit ?? "/ mo",
            totalLabel: x.quantity ? (x.totalLabel ?? "Total monthly investment") : "",
            total: x.quantity ? money(x.amount * x.quantity) : "",
            recommended: x.recommended,
          }))}
          note={b.note ? { text: b.note } : undefined}
        />
      );
  }
}

export function customModule(id: string): ProposalModule {
  return {
    id,
    title: `Página a la medida (${id.slice(CUSTOM_PREFIX.length)})`,
    description: "Página de un trato armada con bloques del sistema visual: secciones, párrafos, listas numeradas, tarjetas, panel oscuro, nota, términos y precios.",
    pages: 1,
    content: {
      schema: customSchema,
      resolve: (ctx: ProposalContext, d: CustomInput) => ({ ...d, eyebrow: d.eyebrow ?? ctx.schoolName }),
      required: true,
      guide: [
        "OBLIGATORIO: title (34) y blocks (1 a 8). Opcional: eyebrow (40, default nombre de la escuela), titleAccent (18, palabra en coral que se agrega DESPUÉS de title; no la repitas: title \"Your first\" + titleAccent \"90 days\"), intro (230).",
        `Cada bloque es un objeto con el campo "type": {"type":"section","label":"How we launch"}, {"type":"numbered","items":["Audit…","Migrate…"]}, {"type":"callout","text":"…"}. NO uses la forma {"section":{…}}.`,
        "Bloques: section{label 52} · paragraphs{columns 1-2: lead 75?, text 320} · numbered{intro 40?, items 2-6 de 95} · cards{items 2-8: icon, label 60} ·",
        "panel{icon?, title 40, body 330, tiles 2-4: icon, label 24?, footer 180?} · callout{text 160} · terms{items 1-2: icon, lead 60, body 360} ·",
        "prices{tiers 1-3: label 28, amount, unit 20?, quantity? (multiplica el total), totalLabel 30?, recommended?; note 120?}.",
        "La página debe caber en 1 hoja: render_proposal la rechaza si se desborda. Cifras solo las que dé el equipo.",
        `Iconos válidos: ${ICON_NAMES.join(", ")}.`,
      ].join(" "),
    },
    render: (_ctx, content) => {
      const c = content as CustomInput & { eyebrow: string };
      return (
        <DealPage>
          <PageTitle eyebrow={c.eyebrow} text={c.title} accent={c.titleAccent} />
          {c.intro ? <Intro text={c.intro} /> : null}
          {c.blocks.map(renderBlock)}
        </DealPage>
      );
    },
  };
}
