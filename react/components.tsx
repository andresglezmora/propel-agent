import React from "react";
import { View, Text, Svg, Path, Polygon, G, StyleSheet } from "@react-pdf/renderer";
import { color, space, font } from "./theme";
import { ICONS, ICONS_FILL } from "./icons";

const s = StyleSheet.create({
  ringIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: color.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  numberRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: color.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: { fontSize: 14, fontWeight: 800, color: color.ink, letterSpacing: -0.5 },
  eyebrow: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: color.purple,
    marginBottom: space.s2,
  },
  h1: {
    fontSize: 24,
    fontWeight: 700,
    color: color.ink,
    letterSpacing: -1,
    marginBottom: space.s3,
  },
  calloutBox: {
    backgroundColor: "#f2effa",
    borderLeftWidth: 3,
    borderLeftColor: color.coral,
    borderRadius: 4,
    padding: 18,
    marginBottom: 14,
  },
});

/** Icono de Phosphor dentro de un anillo coral, sobre fondo blanco/claro —
 * peso "fill" (silueta sólida), no "regular" (contorno), para que se vea
 * lleno en vez de un dibujo de líneas delgadas. */
export function IconRing({ icon, size = 40 }: { icon: keyof typeof ICONS_FILL; size?: number }) {
  const paths = ICONS_FILL[icon];
  return (
    <View style={[s.ringIcon, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 256 256">
        {paths.map((d, i) => (
          <Path key={i} d={d} fill={color.coral} />
        ))}
      </Svg>
    </View>
  );
}

/** El anillo numerado "01 / 02 / 03" que aparece en varias páginas del
 * original — reconstruido como componente, no clonado pixel a pixel. */
export function NumberBadge({ n }: { n: number }) {
  return (
    <View style={s.numberRing}>
      <Text style={s.numberText}>{String(n).padStart(2, "0")}</Text>
    </View>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={s.eyebrow}>{children}</Text>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={s.h1}>{children}</Text>;
}

export function Callout({ children }: { children: React.ReactNode }) {
  return <View style={s.calloutBox}>{children}</View>;
}

/** Check/X de la tabla de precios, como ícono real en vez de un emoji o
 * recorte de imagen. */
export function CheckMark({ ok = true }: { ok?: boolean }) {
  const fill = ok ? color.green : "#c7c2d6";
  const d = ok ? ICONS.check[0] : ICONS.x[0];
  return (
    <Svg width={16} height={16} viewBox="0 0 256 256">
      <Path d={d} fill={fill} />
    </Svg>
  );
}

const s2 = StyleSheet.create({
  pillarNum: { fontSize: 15, fontWeight: 800, color: color.coral, marginBottom: 2 },
  pillarTitle: { fontSize: 20, fontWeight: 800, letterSpacing: -1, color: color.ink, marginBottom: 6 },
  pillarSub: { fontSize: 12, fontWeight: 700, color: color.purple, marginBottom: 10 },

  pill: {
    backgroundColor: color.coral,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: { fontSize: 8.8, fontWeight: 700, color: color.white },

  statBox: { alignItems: "center", justifyContent: "center" },
  statNum: { fontSize: 30, fontWeight: 800, color: color.coral, letterSpacing: -1 },
  statLabel: { fontSize: 8, color: color.muted, marginTop: 2, textAlign: "center", maxWidth: 140 },
});

/** Encabezado repetido en las 6 páginas de "pilares" (Lead Generation,
 * Robust CRM, etc.): número grande + título + subtítulo en itálica-bold. */
export function PillarHeader({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s2.pillarNum}>{n}</Text>
      <Text style={s2.pillarTitle}>{title}</Text>
      <Text style={s2.pillarSub}>{sub}</Text>
    </View>
  );
}

/** Chip de texto (posters, websites, landing pages...) — página de Full
 * Marketing Design. */
export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <View style={s2.pill}>
      <Text style={s2.pillText}>{children}</Text>
    </View>
  );
}

/** El stat grande tipo "24–72hr" de la página de Parent Outreach. */
export function BigStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s2.statBox}>
      <Text style={s2.statNum}>{value}</Text>
      <Text style={s2.statLabel}>{label}</Text>
    </View>
  );
}

/** La insignia "starburst" (estrella de puntas irregulares) que pediste para
 * Robust CRM — un polígono real en <Svg>, no una imagen, así se puede
 * recolorear y no pixela. */
function starburstPoints(cx: number, cy: number, rOuter: number, rInner: number, spikes: number) {
  const pts: string[] = [];
  const step = Math.PI / spikes;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = i * step - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}

export function Starburst({ icon, size = 80 }: { icon: keyof typeof ICONS; size?: number }) {
  const paths = ICONS[icon];
  const c = size / 2;
  const iconSize = size * 0.36;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon points={starburstPoints(c, c, c, c * 0.72, 10)} fill={color.coral} />
      <G transform={`translate(${c - iconSize / 2}, ${c - iconSize / 2}) scale(${iconSize / 256})`}>
        {paths.map((d, i) => (
          <Path key={i} d={d} fill="#ffffff" />
        ))}
      </G>
    </Svg>
  );
}

export const shared = { color, space, font };
