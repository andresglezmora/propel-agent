import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { color, space } from "../theme";
import {
  buildAgreementSections,
  exhibitA,
  exhibitC,
  type NetworkFee,
  EXHIBIT_B,
  EXHIBIT_D,
} from "../agreementContent";

// El cuerpo legal usa Inter, no Manrope — así se ve en el PDF original (ver
// PRD sección 5) y de paso distingue a simple vista "esto es el contrato"
// de "esto es la propuesta". Es un solo <Page wrap> larguísimo: se deja que
// @react-pdf/renderer reparta los saltos de página solos, igual que el
// texto legal fluye libremente entre las páginas 15-21 del original — no
// hay un motivo de diseño para forzar cortes exactos aquí.
const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    color: "#26263a",
    paddingHorizontal: space.s6,
    paddingVertical: 48,
    fontSize: 9.3,
    lineHeight: 1.5,
  },
  docTitle: { fontFamily: "Manrope", fontSize: 16, fontWeight: 800, color: color.ink, marginBottom: 8 },
  docSub: { fontFamily: "Manrope", fontSize: 9.5, color: color.muted, marginBottom: 4 },
  docParty: { fontSize: 9, color: color.muted, marginBottom: 24 },

  section: { marginBottom: 14 },
  heading: {
    fontFamily: "Manrope",
    fontSize: 10.5,
    fontWeight: 700,
    color: color.purple,
    marginBottom: 6,
  },
  p: { marginBottom: 6 },
  kvRow: { marginBottom: 5 },
  kvLabel: { fontWeight: 700, color: "#1a1a2e" },
  bullet: { marginBottom: 3, marginLeft: 4 },

  exhibitDivider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e1ee",
    marginTop: 10,
    marginBottom: 16,
    paddingTop: 16,
  },
  exhibitHeading: { fontFamily: "Manrope", fontSize: 12.5, fontWeight: 800, color: color.ink, marginBottom: 2 },
  exhibitSub: { fontFamily: "Manrope", fontSize: 9, fontWeight: 700, color: color.coral, marginBottom: 10 },
  groupTitle: { fontFamily: "Manrope", fontWeight: 700, color: "#1a1a2e", fontSize: 9.3, marginBottom: 3, marginTop: 8 },

  sigRow: { flexDirection: "row", gap: space.s5, marginTop: 24 },
  sigCol: { flex: 1 },
  sigCompany: { fontFamily: "Manrope", fontWeight: 700, fontSize: 10, marginBottom: 18 },
  sigLine: { borderTopWidth: 1, borderTopColor: "#26263a", marginTop: 18, paddingTop: 4, fontSize: 8.5, color: color.muted },
});

export function AgreementPage({ schoolName, possessive, fee }: { schoolName: string; possessive: string; fee?: NetworkFee }) {
  const sections = buildAgreementSections(schoolName, possessive, fee);
  const EXHIBIT_A = exhibitA(fee);
  const EXHIBIT_C = exhibitC(fee);

  return (
    <Page size="LETTER" style={s.page} wrap>
      <Text style={s.docTitle}>Services Agreement</Text>
      <Text style={s.docSub}>Building Clarity, Capacity, and Full Enrollment</Text>
      <Text style={s.docParty}>Between TrustED Solutions (d/b/a TrustED) and {schoolName}</Text>

      {sections.map((sec, i) => (
        <View key={i} style={s.section} wrap={false}>
          <Text style={s.heading}>{sec.number ? `${sec.number}) ` : ""}{sec.heading}</Text>
          {sec.blocks.map((b, j) => {
            if (b.type === "p") return <Text key={j} style={s.p}>{b.text}</Text>;
            if (b.type === "kv")
              return (
                <Text key={j} style={s.kvRow}>
                  <Text style={s.kvLabel}>{b.label} </Text>
                  {b.text}
                </Text>
              );
            return (
              <View key={j}>
                {b.items.map((it) => (
                  <Text key={it} style={s.bullet}>• {it}</Text>
                ))}
              </View>
            );
          })}
        </View>
      ))}

      {/* Exhibit A */}
      <View style={s.exhibitDivider}>
        <Text style={s.exhibitHeading}>{EXHIBIT_A.heading}</Text>
        <Text style={s.exhibitSub}>{EXHIBIT_A.sub}</Text>
        {EXHIBIT_A.groups.map((g) => (
          <View key={g.title} wrap={false}>
            <Text style={s.groupTitle}>{g.title}</Text>
            {g.items.map((it) => (
              <Text key={it} style={s.bullet}>• {it}</Text>
            ))}
          </View>
        ))}
      </View>

      {/* Exhibit B */}
      <View style={s.exhibitDivider} wrap={false}>
        <Text style={s.exhibitHeading}>{EXHIBIT_B.heading}</Text>
        <Text style={s.exhibitSub}>{EXHIBIT_B.sub}</Text>
        <Text style={s.p}>{EXHIBIT_B.intro}</Text>
        {EXHIBIT_B.items.map((it) => (
          <Text key={it} style={s.bullet}>• {it}</Text>
        ))}
      </View>

      {/* Exhibit C */}
      <View style={s.exhibitDivider} wrap={false}>
        <Text style={s.exhibitHeading}>{EXHIBIT_C.heading}</Text>
        {EXHIBIT_C.items.map((it) => (
          <Text key={it.label} style={s.kvRow}>
            <Text style={s.kvLabel}>{it.label} </Text>
            {it.text}
          </Text>
        ))}
      </View>

      {/* Exhibit D */}
      <View style={s.exhibitDivider} wrap={false}>
        <Text style={s.exhibitHeading}>{EXHIBIT_D.heading}</Text>
        {EXHIBIT_D.items.map((it) => (
          <Text key={it.label} style={s.kvRow}>
            <Text style={s.kvLabel}>{it.label} </Text>
            {it.text}
          </Text>
        ))}
      </View>

      {/* Firmas */}
      <View style={s.exhibitDivider} wrap={false}>
        <Text style={s.exhibitHeading}>Signatures</Text>
        <View style={s.sigRow}>
          <View style={s.sigCol}>
            <Text style={s.sigCompany}>TrustED Solutions</Text>
            <Text style={s.sigLine}>Name</Text>
            <Text style={s.sigLine}>Title</Text>
            <Text style={s.sigLine}>Date</Text>
          </View>
          <View style={s.sigCol}>
            <Text style={s.sigCompany}>{schoolName}</Text>
            <Text style={s.sigLine}>Name</Text>
            <Text style={s.sigLine}>Title</Text>
            <Text style={s.sigLine}>Date</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}
