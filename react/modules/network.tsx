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
import type { ProposalContext, ProposalModule } from "./types";

// Hojas de propuesta para una RED de escuelas, a partir de las que se hicieron
// a mano para Noble Schools (17 campus). Los precios son de cada trato: no hay
// tabla de descuentos, así que llegan como datos y el código calcula los
// totales. El texto trae un default genérico (el de Noble, con el nombre de la
// escuela) que el equipo puede reemplazar o que el modelo puede proponer.

const short = (ctx: ProposalContext) => ctx.schoolShort || ctx.schoolName;
const t = (max: number) => z.string().trim().min(1).max(max);
const iconName = z.enum(ICON_NAMES as [IconName, ...IconName[]]);

/** titleAccent se dibuja en coral DESPUÉS de title: si title ya lo trae, sale repetido. */
export const accentNotRepeated = (d: { title?: string; titleAccent?: string }) =>
  !d.title || !d.titleAccent || !d.title.trim().toLowerCase().endsWith(d.titleAccent.trim().toLowerCase());
export const ACCENT_MESSAGE =
  'titleAccent se agrega al final de title y no debe repetirse en él: title "Your first", titleAccent "90 days".';

export function money(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ───────────────────────── precios por red ─────────────────────────

const pricingSchema = z
  .object({
    tiers: z
      .array(
        z.object({
          campuses: z.number().int().positive(),
          pricePerCampus: z.number().positive(),
          label: t(28).optional(),
          recommended: z.boolean().optional(),
        }),
      )
      .min(1)
      .max(3),
    totalCampuses: z.number().int().positive().optional(),
    standardPrice: z.number().positive().optional(),
    eyebrow: t(40).optional(),
    title: t(34).optional(),
    titleAccent: t(18).optional(),
    intro: t(230).optional(),
    whyHeading: t(52).optional(),
    whyLead: t(75).optional(),
    whyLeadBody: t(190).optional(),
    whyBody: t(300).optional(),
    reasonsIntro: t(40).optional(),
    reasons: z.array(t(95)).min(4).max(6).optional(),
    closing: t(160).optional(),
  })
  .refine((d) => d.tiers.filter((x) => x.recommended).length <= 1, { message: "Solo una opción puede ser la recomendada." })
  .refine(accentNotRepeated, { message: ACCENT_MESSAGE });

type PricingInput = z.infer<typeof pricingSchema>;

function resolvePricing(ctx: ProposalContext, d: PricingInput) {
  const name = short(ctx);
  const totalCampuses = d.totalCampuses ?? Math.max(...d.tiers.map((x) => x.campuses));
  return {
    eyebrow: d.eyebrow ?? ctx.schoolName,
    title: d.title ?? "A coordinated approach to",
    titleAccent: d.titleAccent ?? "enrollment",
    intro:
      d.intro ??
      "Bring marketing, family outreach, and enrollment tracking together, with support tailored to each campus and clear reporting for district leadership.",
    tiers: d.tiers.map((x) => ({
      label: x.label ?? (x.campuses === totalCampuses && d.tiers.length > 1 ? `All ${x.campuses} campuses` : `${x.campuses} campuses`),
      price: money(x.pricePerCampus),
      unit: "/ campus / mo",
      totalLabel: "Total monthly investment",
      total: money(x.campuses * x.pricePerCampus),
      recommended: x.recommended,
    })),
    standardPrice: d.standardPrice ?? 2500,
    whyHeading: d.whyHeading ?? "Why we recommend Full Service across the network",
    whyLead: d.whyLead ?? "Enrollment works best when every part of the process works together.",
    whyLeadBody:
      d.whyLeadBody ??
      "Our team connects the campaigns that attract families, the follow-up that keeps them engaged, and the steps that move them toward enrollment.",
    whyBody:
      d.whyBody ??
      `With all campuses participating, ${name} gains a coordinated strategy and a clear view of what's working across the network. Each school keeps its own identity, messaging, and enrollment priorities, while shared systems reduce duplicated work and make handoffs easier.`,
    reasonsIntro: d.reasonsIntro ?? "This approach allows us to:",
    reasons: d.reasons ?? [
      "Build campaigns around each campus's open seats and enrollment goals.",
      "Connect marketing, design, CRM, and bilingual outreach in one coordinated workflow.",
      "Keep interested families moving with timely calls, texts, and emails.",
      "Identify where families need support and coordinate next steps with school staff.",
      "Track progress by campus and apply successful approaches across the network.",
      `Give ${name}'s team more capacity without coordinating separate vendors for each function.`,
    ],
    closing:
      d.closing ??
      "The goal is to turn more family interest into completed enrollment while making the work easier to manage across every school.",
  };
}

export const networkPricing: ProposalModule = {
  id: "network-pricing",
  title: "Precios por red",
  description:
    "Hoja de trato para una red: hasta 3 opciones de precio por número de campus (con totales calculados) y por qué conviene Full Service en toda la red. Basada en la propuesta de Noble Schools.",
  pages: 1,
  content: {
    schema: pricingSchema,
    resolve: (ctx, d: PricingInput) => resolvePricing(ctx, d),
    required: true,
    guide: [
      "OBLIGATORIO: tiers, de 1 a 3 opciones, cada una con campuses (entero) y pricePerCampus (USD al mes por campus). Son de cada trato: pídeselos al equipo, nunca los inventes. Los totales los calcula el código.",
      "Opcional: recommended:true en una sola opción; totalCampuses (si no, el mayor número de campus); standardPrice (default 2500); label de cada opción (default \"10 campuses\" / \"All 17 campuses\").",
      "titleAccent es la palabra en coral que va DESPUÉS de title (no la repitas en title). Texto opcional con límites de caracteres: intro 230, whyHeading 52, whyLead 75, whyLeadBody 190, whyBody 300, reasonsIntro 40, reasons de 4 a 6 frases de 95, closing 160, title 34, titleAccent 18 (la palabra en coral).",
      "Sin texto se usa el de Noble con el nombre de la escuela.",
    ].join(" "),
  },
  render: (_ctx, content) => {
    const c = content as ReturnType<typeof resolvePricing>;
    return (
      <DealPage>
        <PageTitle eyebrow={c.eyebrow} text={c.title} accent={c.titleAccent} />
        <Intro text={c.intro} />
        <SectionLabel label="Full Service partnership options" />
        <PriceCards
          tiers={c.tiers}
          note={{ text: "Standard Full Service pricing:", strong: `${money(c.standardPrice)} per campus per month.` }}
        />
        <SectionLabel label={c.whyHeading} />
        <Paragraphs columns={[{ lead: c.whyLead, text: c.whyLeadBody }, { text: c.whyBody }]} />
        <NumberedList intro={c.reasonsIntro} items={c.reasons} />
        <Callout text={c.closing} />
      </DealPage>
    );
  },
};

/** Precio que pasa al contrato: la opción recomendada, o la única si hay una
 * sola. Con varias opciones y ninguna recomendada no hay un precio que firmar. */
export function networkFeeFrom(ctx: ProposalContext): { fee?: { pricePerCampus: string; campuses: number; total: string }; error?: string } {
  const raw = ctx.content?.["network-pricing"];
  if (raw === undefined) return {};
  const parsed = pricingSchema.safeParse(raw);
  if (!parsed.success) return {};
  const tiers = parsed.data.tiers;
  const chosen = tiers.length === 1 ? tiers[0] : tiers.find((x) => x.recommended);
  if (!chosen) {
    return {
      error:
        'El contrato toma el precio de la opción recomendada de network-pricing: marca una con recommended:true (o deja una sola opción).',
    };
  }
  return {
    fee: {
      pricePerCampus: money(chosen.pricePerCampus),
      campuses: chosen.campuses,
      total: money(chosen.campuses * chosen.pricePerCampus),
    },
  };
}

// ───────────────────────── qué incluye ─────────────────────────

const includesSchema = z.object({
  eyebrow: t(40).optional(),
  title: t(28).optional(),
  titleAccent: t(18).optional(),
  services: z.array(z.object({ icon: iconName, label: t(60) })).min(2).max(8).optional(),
  reportingTitle: t(40).optional(),
  reportingBody: t(330).optional(),
  reportingMetrics: z.array(z.object({ icon: iconName, label: t(24) })).length(4).optional(),
  reportingFooter: t(180).optional(),
  termsLead: t(60).optional(),
  termsBody: t(120).optional(),
  termsDetailLead: t(40).optional(),
  termsDetailBody: t(360).optional(),
}).refine(accentNotRepeated, { message: ACCENT_MESSAGE });

type IncludesInput = z.infer<typeof includesSchema>;

function resolveIncludes(ctx: ProposalContext, d: IncludesInput) {
  const name = short(ctx);
  const pricing = ctx.content?.["network-pricing"] as { totalCampuses?: number; tiers?: { campuses: number }[] } | undefined;
  const campuses = pricing?.totalCampuses ?? (pricing?.tiers?.length ? Math.max(...pricing.tiers.map((x) => x.campuses)) : undefined);
  return {
    eyebrow: d.eyebrow ?? ctx.schoolName,
    title: d.title ?? "Full Service",
    titleAccent: d.titleAccent ?? "includes",
    services: d.services ?? [
      { icon: "database", label: "EnrollED CRM and automated family follow-up" },
      { icon: "megaphone", label: "Marketing campaign management and landing pages" },
      { icon: "paint-brush", label: "Marketing asset design" },
      { icon: "chats", label: "Bilingual family outreach" },
      { icon: "squares-four", label: "Individual school dashboards" },
      { icon: "chart-line-up", label: "District reporting" },
      { icon: "users-three", label: "Ongoing strategy and team support" },
    ],
    reportingTitle: d.reportingTitle ?? "District reporting included",
    reportingBody:
      d.reportingBody ??
      `District reporting brings participating campuses' results into one shared view. ${name}'s leadership can track inquiries, outreach activity, application progress, and enrollment outcomes using available connected data, with visibility into individual schools and the network overall.`,
    reportingMetrics: d.reportingMetrics ?? [
      { icon: "envelope", label: "Inquiries" },
      { icon: "phone-call", label: "Outreach activity" },
      { icon: "clipboard-text", label: "Application progress" },
      { icon: "graduation-cap", label: "Enrollment outcomes" },
    ],
    reportingFooter:
      d.reportingFooter ??
      "This helps the team identify where additional support is needed and make informed decisions about campaigns, follow-up, and resources.",
    termsLead: d.termsLead ?? "Annual agreement preferred, billed monthly.",
    termsBody: d.termsBody ?? "Month-to-month arrangements are also available.",
    termsDetailLead: d.termsDetailLead ?? "Advertising spend is separate.",
    termsDetailBody:
      d.termsDetailBody ??
      [
        "Final scope will define outreach capacity, communication allowances, design deliverables, integrations, and meeting cadence.",
        campuses ? `Full-network pricing assumes ${campuses} participating campuses.` : null,
        "Changes to campus participation or services require an agreed pricing adjustment.",
      ]
        .filter(Boolean)
        .join(" "),
  };
}

export const networkIncludes: ProposalModule = {
  id: "network-includes",
  title: "Qué incluye (red)",
  description:
    "Hoja de trato para una red: servicios incluidos, reportes de distrito y términos de la alianza. Va junto a network-pricing. Basada en la propuesta de Noble Schools.",
  pages: 1,
  content: {
    schema: includesSchema,
    resolve: (ctx, d: IncludesInput) => resolveIncludes(ctx, d),
    required: false,
    guide: [
      "Todo es opcional: sin contenido usa el texto de Noble con el nombre de la escuela y el número de campus de network-pricing.",
      `services: de 2 a 8 {icon, label 60}. reportingMetrics: exactamente 4 {icon, label 24}. Límites: reportingBody 330, reportingFooter 180, termsLead 60, termsBody 120, termsDetailLead 40, termsDetailBody 360.`,
      `Iconos válidos (Phosphor): ${ICON_NAMES.join(", ")}.`,
    ].join(" "),
  },
  render: (_ctx, content) => {
    const c = content as ReturnType<typeof resolveIncludes>;
    return (
      <DealPage>
        <PageTitle eyebrow={c.eyebrow} text={c.title} accent={c.titleAccent} />
        <IconCards items={c.services as { icon: IconName; label: string }[]} />
        <DarkPanel
          title={c.reportingTitle}
          body={c.reportingBody}
          tiles={c.reportingMetrics as { icon: IconName; label: string }[]}
          footer={c.reportingFooter}
        />
        <SectionLabel label="Partnership terms" />
        <TermCards
          items={[
            { icon: "calendar-check", lead: c.termsLead, body: c.termsBody },
            { icon: "file-text", lead: c.termsDetailLead, body: c.termsDetailBody },
          ]}
        />
      </DealPage>
    );
  },
};
