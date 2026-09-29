import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { color, space, font } from "../theme";
import { IconRing, CheckMark } from "../components";

// Los 3 anchos de columna se definen UNA vez y se usan tanto en el
// encabezado como en cada fila — antes el encabezado usaba flex:1 en la
// columna de rol mientras las filas usaban flex:1.8, así que nada
// quedaba alineado con lo de arriba. Ahora es la misma constante en los dos
// lugares.
const COL = { role: 1.8, cost: 1, check: 0.9 };
const LOGO_RATIO = 1698 / 421;

const s = StyleSheet.create({
  page: { fontFamily: font.display, color: color.ink, paddingHorizontal: space.s6, paddingVertical: 48 },
  head: { alignItems: "center", marginBottom: 30 },
  h1: { fontSize: 20, fontWeight: 800, letterSpacing: -1, textAlign: "center", marginTop: 10, lineHeight: 1.3 },

  table: { borderWidth: 1, borderColor: "#e5e1ee", borderRadius: 8, overflow: "hidden" },
  headRow: { flexDirection: "row", backgroundColor: "#f6f4fa", borderBottomWidth: 1, borderBottomColor: "#e5e1ee", alignItems: "center" },
  headCellRole: { flex: COL.role, paddingVertical: 10, paddingHorizontal: space.s3 },
  headCellCost: { flex: COL.cost, paddingVertical: 10, paddingHorizontal: space.s3, alignItems: "center" },
  headCellCheck: { flex: COL.check, paddingVertical: 10, alignItems: "center" },
  headCellText: { fontSize: 9.5, fontWeight: 700, color: color.muted, letterSpacing: 0.5 },
  headLogo: { width: 20 * LOGO_RATIO, height: 20, objectFit: "contain" },

  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#efedf5", alignItems: "center" },
  roleCell: { flex: COL.role, paddingVertical: 13, paddingHorizontal: space.s3 },
  roleText: { fontSize: 10.5, color: "#3a3a4a" },
  costCell: { flex: COL.cost, paddingVertical: 13, paddingHorizontal: space.s3, alignItems: "center" },
  costText: { fontSize: 13, fontWeight: 800, color: color.muted },
  checkCell: { flex: COL.check, alignItems: "center", paddingVertical: 13 },

  totalRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f6f4fa" },
  totalLabel: { flex: COL.role, paddingVertical: 14, paddingHorizontal: space.s3, fontSize: 10.5, fontWeight: 700 },
  totalCost: { flex: COL.cost, alignItems: "center", paddingHorizontal: space.s3 },
  totalCostText: { fontSize: 14, fontWeight: 800, color: color.coral },
  totalAvoided: { fontSize: 8, color: color.coral, fontWeight: 700 },
  totalTrust: { flex: COL.check, textAlign: "center", fontSize: 13, fontWeight: 800, color: color.green },

  footer: { marginTop: 26, backgroundColor: "#eeecf3", borderRadius: 8, padding: 18 },
  footerTitle: { fontSize: 10, fontWeight: 700, color: color.purple, marginBottom: 6, textAlign: "center" },
  footerBody: { fontSize: 9.3, lineHeight: 1.5, color: "#3a3a4a", textAlign: "center" },
});

const ROLES = [
  { role: "Chief Marketing Officer", cost: "$120,000" },
  { role: "Creative & Design Team", cost: "$80,000" },
  { role: "Social Media Managers", cost: "$70,000" },
  { role: "Bilingual Parent Outreach", cost: "$50,000" },
  { role: "Data / Analytics & Ops", cost: "$70,000" },
  { role: "Developers (CRM / automation)", cost: "$90,000" },
] as const;

export function CostComparisonPage({ logoDark }: { logoDark: string }) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.head}>
        <IconRing icon="trophy" size={44} />
        <Text style={s.h1}>The Power of a Full Enrollment Team{"\n"}Without the Overhead</Text>
      </View>

      <View style={s.table}>
        <View style={s.headRow}>
          <View style={s.headCellRole}><Text style={s.headCellText}>ROLE EQUIVALENT</Text></View>
          <View style={s.headCellCost}><Text style={s.headCellText}>MARKET COST</Text></View>
          <View style={s.headCellCheck}><Image src={logoDark} style={s.headLogo} /></View>
        </View>
        {ROLES.map((r) => (
          <View key={r.role} style={s.row}>
            <View style={s.roleCell}><Text style={s.roleText}>{r.role}</Text></View>
            <View style={s.costCell}><Text style={s.costText}>{r.cost}</Text></View>
            <View style={s.checkCell}><CheckMark ok /></View>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>TOTAL COSTS</Text>
          <View style={s.totalCost}>
            <Text style={s.totalCostText}>$480,000+</Text>
            <Text style={s.totalAvoided}>AVOIDED</Text>
          </View>
          <Text style={s.totalTrust}>$2,500/mo</Text>
        </View>
      </View>

      <View style={s.footer}>
        <Text style={s.footerTitle}>AD SPEND & PRINTING NOT INCLUDED</Text>
        <Text style={s.footerBody}>
          Our pricing covers all strategy, management, and optimization, while ad spend and
          printing costs are kept separate for full transparency. This way, schools know exactly
          how much is being invested in advertising and materials, and can clearly see which
          campaigns are producing results.
        </Text>
      </View>
    </Page>
  );
}
