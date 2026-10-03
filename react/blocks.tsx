import React from "react";
import { Page, View, Text, Svg, Path, Rect, Defs, LinearGradient, Stop, StyleSheet } from "@react-pdf/renderer";
import { color, font } from "./theme";
import { ICONS, ICONS_FILL } from "./icons";

// Bloques de las páginas "de trato" (las hojas que se hicieron a mano para
// Noble Schools): mismo sistema visual que la plantilla (coral, morado, barra
// degradada, Manrope) pero armado con piezas que se combinan. Los módulos de
// red (modules/network.tsx) y las páginas a la medida (modules/custom.tsx)
// usan exactamente estos bloques, así que una página nueva no inventa estilo.

export const NAVY = "#27234a";
const DARK = "#2f2558";
const LINE = "#e8e5ef";
const CORAL_SOFT = "#fdece8";
const CORAL_LINE = "#f4d6cf";
const GRAY_BG = "#f5f5f8";

export type IconName = keyof typeof ICONS & keyof typeof ICONS_FILL;
export const ICON_NAMES = Object.keys(ICONS).filter((k) => k in ICONS_FILL) as IconName[];

const s = StyleSheet.create({
  page: { fontFamily: font.display, color: NAVY, paddingTop: 40, paddingBottom: 44, paddingHorizontal: 42 },
  eyebrow: { fontSize: 7.5, fontWeight: 800, color: color.coral, letterSpacing: 1.2, marginBottom: 14 },
  title: { fontSize: 23, fontWeight: 500, letterSpacing: -1.3, lineHeight: 1.1, color: NAVY, marginBottom: 10 },
  titleAccent: { fontWeight: 800, color: color.coral },
  intro: { fontSize: 10.2, lineHeight: 1.55, color: "#5a5873", maxWidth: 400, marginBottom: 22 },

  section: { flexDirection: "row", alignItems: "center", marginBottom: 10, marginTop: 4 },
  sectionLabel: { fontSize: 7.8, fontWeight: 800, letterSpacing: 0.3, marginLeft: 8, color: NAVY },

  prices: { flexDirection: "row", marginBottom: 8 },
  priceCard: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 9, paddingVertical: 15, paddingHorizontal: 16 },
  priceCardDark: { backgroundColor: DARK, borderColor: DARK },
  priceHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 14, marginBottom: 10 },
  priceLabel: { fontSize: 7.6, fontWeight: 700, letterSpacing: 0.2 },
  pill: { backgroundColor: color.coral, borderRadius: 8, paddingVertical: 2.5, paddingHorizontal: 7 },
  pillText: { fontSize: 5.6, fontWeight: 800, color: "#fff", letterSpacing: 0.3 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10 },
  price: { fontSize: 20, fontWeight: 800, letterSpacing: -0.6 },
  priceUnit: { fontSize: 6.6, fontWeight: 700, marginLeft: 5, marginBottom: 3.5 },
  priceRule: { height: 1, backgroundColor: LINE, marginBottom: 9 },
  totalLabel: { fontSize: 6.8, fontWeight: 700, marginBottom: 4 },
  total: { fontSize: 11.5, fontWeight: 800 },
  note: { fontSize: 6.9, color: "#6b6984", marginBottom: 20 },
  noteStrong: { fontWeight: 800, color: NAVY },

  cols: { flexDirection: "row", marginBottom: 14 },
  col: { flex: 1 },
  para: { fontSize: 8.9, lineHeight: 1.6, color: "#5a5873" },
  paraLead: { fontWeight: 800, color: NAVY },

  listIntro: { fontSize: 7.6, fontWeight: 800, marginBottom: 6 },
  numbered: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 12 },
  numItem: { width: "48.5%", flexDirection: "row", alignItems: "flex-start", borderTopWidth: 1, borderTopColor: CORAL_LINE, paddingTop: 9, paddingBottom: 10 },
  numCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: color.coral, alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1 },
  numText: { fontSize: 5.8, fontWeight: 800, color: color.coral },
  numBody: { flex: 1, fontSize: 8.7, lineHeight: 1.5, color: NAVY },

  callout: { flexDirection: "row", backgroundColor: GRAY_BG, borderRadius: 6, marginTop: 14, overflow: "hidden" },
  calloutText: { flex: 1, fontSize: 8.9, lineHeight: 1.55, fontWeight: 800, color: NAVY, paddingVertical: 13, paddingLeft: 18, paddingRight: 15 },

  cards: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 18 },
  card: { width: "49.2%", flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: LINE, borderRadius: 8, paddingVertical: 13, paddingHorizontal: 13, marginBottom: 6 },
  cardFull: { width: "100%" },
  iconSquare: { width: 24, height: 24, borderRadius: 6, backgroundColor: CORAL_SOFT, alignItems: "center", justifyContent: "center", marginRight: 12 },
  cardLabel: { flex: 1, fontSize: 8.7, fontWeight: 700, lineHeight: 1.4 },

  panel: { backgroundColor: DARK, borderRadius: 10, padding: 20, marginBottom: 20 },
  panelHead: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  panelTitle: { fontSize: 7.8, fontWeight: 800, color: "#fff", marginLeft: 8, letterSpacing: 0.3 },
  panelBody: { fontSize: 8.9, lineHeight: 1.6, color: "#d9d6e8", marginBottom: 12 },
  tiles: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  tile: { flex: 1, borderWidth: 1, borderColor: "#4c4378", borderRadius: 7, padding: 11, marginRight: 6 },
  tileLast: { marginRight: 0 },
  tileIcon: { width: 22, height: 22, borderRadius: 5, backgroundColor: color.violet, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  tileLabel: { fontSize: 7.8, fontWeight: 700, color: "#fff" },
  panelFooter: { fontSize: 8.9, lineHeight: 1.55, fontWeight: 800, color: "#fff" },

  terms: { flexDirection: "row", justifyContent: "space-between" },
  termCard: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 8, padding: 15, marginRight: 8 },
  termCardLast: { marginRight: 0 },
  termCardTinted: { backgroundColor: GRAY_BG, borderColor: GRAY_BG, flexDirection: "row", padding: 0, overflow: "hidden" },
  termInner: { flex: 1, padding: 15, paddingLeft: 18 },
  termLead: { fontSize: 9.2, fontWeight: 800, lineHeight: 1.55 },
  termBody: { fontSize: 9.2, lineHeight: 1.55, color: "#6b6984" },
  termSmall: { fontSize: 7.8, lineHeight: 1.6, color: "#6b6984" },
  termSmallLead: { fontWeight: 800, color: NAVY },

  bar: { position: "absolute", left: 0, right: 0, bottom: 0, height: 11 },
});

export function Icon({ name, size, fill, weight = "regular" }: { name: IconName; size: number; fill: string; weight?: "regular" | "fill" }) {
  const paths = (weight === "fill" ? ICONS_FILL : ICONS)[name] ?? [];
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      {paths.map((d, i) => (
        <Path key={i} d={d} fill={fill} />
      ))}
    </Svg>
  );
}

/** Franja degradada vertical pegada al borde izquierdo de un contenedor con
 * overflow:hidden: se dibuja alta y el contenedor la recorta a su altura real. */
function EdgeStrip() {
  return (
    <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3 }}>
      <GradientStrip width={3} height={400} vertical />
    </View>
  );
}

function GradientStrip({ width, height, vertical = false }: { width: number | string; height: number | string; vertical?: boolean }) {
  return (
    <Svg width={width as number} height={height as number} viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="g" x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "0"}>
          <Stop offset="0" stopColor={color.coral} />
          <Stop offset="1" stopColor={color.violet} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill="url(#g)" />
    </Svg>
  );
}

// ───────────────────────── página y encabezados ─────────────────────────

export function DealPage({ children }: { children: React.ReactNode }) {
  return (
    <Page size="LETTER" style={s.page}>
      {children}
      <View style={s.bar} fixed>
        <GradientStrip width={612} height={11} />
      </View>
    </Page>
  );
}

export function PageTitle({ eyebrow, text, accent }: { eyebrow: string; text: string; accent?: string }) {
  // Si el título ya trae la palabra del acento, no se repite.
  if (accent && text.trim().toLowerCase().endsWith(accent.trim().toLowerCase())) {
    text = text.trim().slice(0, text.trim().length - accent.trim().length).trim();
  }
  return (
    <View>
      <Text style={s.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text style={s.title}>
        {text.toUpperCase()}
        {accent ? <Text style={s.titleAccent}> {accent.toUpperCase()}</Text> : null}
      </Text>
    </View>
  );
}

export function Intro({ text }: { text: string }) {
  return <Text style={s.intro}>{text}</Text>;
}

export function SectionLabel({ label }: { label: string }) {
  return (
    <View style={s.section}>
      <Icon name="seal-check" size={11} fill={color.coral} weight="fill" />
      <Text style={s.sectionLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

// ───────────────────────── precios ─────────────────────────

export type PriceTier = { label: string; price: string; unit: string; totalLabel: string; total: string; recommended?: boolean };

export function PriceCards({ tiers, note }: { tiers: PriceTier[]; note?: { text: string; strong?: string } }) {
  return (
    <View>
      <View style={s.prices}>
        {tiers.map((t, i) => {
          const dark = !!t.recommended;
          const fg = dark ? "#fff" : NAVY;
          const sub = dark ? "#d9d6e8" : "#6b6984";
          return (
            <View key={i} style={[s.priceCard, dark ? s.priceCardDark : {}, i < tiers.length - 1 ? { marginRight: 9 } : {}]}>
              <View style={s.priceHead}>
                <Text style={[s.priceLabel, { color: fg }]}>{t.label.toUpperCase()}</Text>
                {dark ? (
                  <View style={s.pill}>
                    <Text style={s.pillText}>RECOMMENDED</Text>
                  </View>
                ) : null}
              </View>
              <View style={s.priceRow}>
                <Text style={[s.price, { color: fg }]}>{t.price}</Text>
                <Text style={[s.priceUnit, { color: fg }]}>{t.unit}</Text>
              </View>
              <View style={[s.priceRule, dark ? { backgroundColor: "#4c4378" } : {}]} />
              <Text style={[s.totalLabel, { color: sub }]}>{t.totalLabel}</Text>
              <Text style={[s.total, { color: fg }]}>{t.total}</Text>
            </View>
          );
        })}
      </View>
      {note ? (
        <Text style={s.note}>
          {note.text}
          {note.strong ? <Text style={s.noteStrong}> {note.strong}</Text> : null}
        </Text>
      ) : (
        <View style={{ marginBottom: 18 }} />
      )}
    </View>
  );
}

// ───────────────────────── texto ─────────────────────────

export function Paragraphs({ columns }: { columns: { lead?: string; text: string }[] }) {
  return (
    <View style={s.cols}>
      {columns.map((c, i) => (
        <View key={i} style={[s.col, i < columns.length - 1 ? { marginRight: 22 } : {}]}>
          <Text style={s.para}>
            {c.lead ? <Text style={s.paraLead}>{c.lead} </Text> : null}
            {c.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function NumberedList({ intro, items }: { intro?: string; items: string[] }) {
  return (
    <View>
      {intro ? <Text style={s.listIntro}>{intro}</Text> : null}
      <View style={s.numbered}>
        {items.map((t, i) => (
          <View key={i} style={s.numItem} wrap={false}>
            <View style={s.numCircle}>
              <Text style={s.numText}>{String(i + 1).padStart(2, "0")}</Text>
            </View>
            <Text style={s.numBody}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function Callout({ text }: { text: string }) {
  return (
    <View style={s.callout} wrap={false}>
      <EdgeStrip />
      <Text style={s.calloutText}>{text}</Text>
    </View>
  );
}

// ───────────────────────── tarjetas y paneles ─────────────────────────

export function IconCards({ items }: { items: { icon: IconName; label: string }[] }) {
  return (
    <View style={s.cards}>
      {items.map((it, i) => {
        const lastOdd = items.length % 2 === 1 && i === items.length - 1;
        return (
          <View key={i} style={[s.card, lastOdd ? s.cardFull : {}]} wrap={false}>
            <View style={s.iconSquare}>
              <Icon name={it.icon} size={13} fill={color.coral} />
            </View>
            <Text style={[s.cardLabel, { color: NAVY }]}>{it.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function DarkPanel({
  icon = "chart-bar",
  title,
  body,
  tiles,
  footer,
}: {
  icon?: IconName;
  title: string;
  body: string;
  tiles?: { icon: IconName; label: string }[];
  footer?: string;
}) {
  return (
    <View style={s.panel} wrap={false}>
      <View style={s.panelHead}>
        <Icon name={icon} size={12} fill={color.violet} weight="fill" />
        <Text style={s.panelTitle}>{title.toUpperCase()}</Text>
      </View>
      <Text style={s.panelBody}>{body}</Text>
      {tiles && tiles.length > 0 ? (
        <View style={s.tiles}>
          {tiles.map((t, i) => (
            <View key={i} style={[s.tile, i === tiles.length - 1 ? s.tileLast : {}]}>
              <View style={s.tileIcon}>
                <Icon name={t.icon} size={12} fill="#fff" />
              </View>
              <Text style={s.tileLabel}>{t.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {footer ? <Text style={s.panelFooter}>{footer}</Text> : null}
    </View>
  );
}

export type TermItem = { icon: IconName; lead: string; body: string };

/** Hasta 2 tarjetas: la primera resaltada (fondo gris y franja degradada), la
 * segunda con texto más chico para el detalle. */
export function TermCards({ items }: { items: TermItem[] }) {
  return (
    <View style={s.terms} wrap={false}>
      {items.map((t, i) => {
        const last = i === items.length - 1;
        if (i === 0) {
          return (
            <View key={i} style={[s.termCard, s.termCardTinted, last ? s.termCardLast : {}, { flex: 0.82 }]}>
              <EdgeStrip />
              <View style={s.termInner}>
                <View style={{ marginBottom: 12 }}>
                  <Icon name={t.icon} size={14} fill={color.coral} />
                </View>
                <Text style={s.termBody}>
                  <Text style={[s.termLead, { color: NAVY }]}>{t.lead} </Text>
                  {t.body}
                </Text>
              </View>
            </View>
          );
        }
        return (
          <View key={i} style={[s.termCard, last ? s.termCardLast : {}]}>
            <View style={{ marginBottom: 12 }}>
              <Icon name={t.icon} size={14} fill={color.coral} />
            </View>
            <Text style={s.termSmall}>
              <Text style={s.termSmallLead}>{t.lead} </Text>
              {t.body}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function Spacer({ h }: { h: number }) {
  return <View style={{ height: h }} />;
}
