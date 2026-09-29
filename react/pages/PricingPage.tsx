import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { color, space, font } from "../theme";
import { CheckMark } from "../components";

const s = StyleSheet.create({
  page: {
    fontFamily: font.display,
    color: color.ink,
    paddingHorizontal: space.s6,
    paddingVertical: 44,
  },
  eyebrow: { fontSize: 10, fontWeight: 700, letterSpacing: 1, color: color.muted, textAlign: "center" },
  h1: { fontSize: 22, fontWeight: 700, letterSpacing: -1, textAlign: "center", marginTop: 6 },
  h1Accent: { color: color.coral, fontWeight: 800 },
  sub: { fontSize: 10.5, color: color.muted, textAlign: "center", marginTop: 6, marginBottom: 20 },

  table: { borderWidth: 1, borderColor: "#e5e1ee", borderRadius: 6, overflow: "hidden" },
  headRow: { flexDirection: "row", backgroundColor: "#f6f4fa", borderBottomWidth: 1, borderBottomColor: "#e5e1ee" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#efedf5" },
  rowLast: { borderBottomWidth: 0 },
  featureCell: { flex: 1.6, paddingVertical: 9, paddingHorizontal: space.s3, justifyContent: "center" },
  planCell: { flex: 1, paddingVertical: 9, alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 10, color: "#3a3a4a" },
  planHeadName: { fontSize: 9.5, fontWeight: 700, color: color.ink },
  planHeadPrice: { fontSize: 9, color: color.muted, marginTop: 1 },
  planHeadFull: { color: color.coral },

  footer: {
    marginTop: 20,
    backgroundColor: color.purpleDark,
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
  },
  footerTitle: { fontSize: 12.5, fontWeight: 700, color: color.white, marginBottom: 8 },
  footerBody: { fontSize: 10, color: "#d8cfe8", textAlign: "center", lineHeight: 1.5, maxWidth: 400 },
});

const FEATURES = [
  "CRM / Lead Tracking",
  "Automations & Nurturing",
  "Landing Pages",
  "Social Media Calendar",
  "Social Media Ads",
  "Data Cleanup & Dashboards",
  "Reputation Management",
  "Creative & Marketing Assets",
  "Fundraising",
  "Retention Campaigns",
  "Parent Outreach Calls",
  "CMO-Level Strategy",
] as const;

type Plan = { name: string; price: string; full?: boolean; included: readonly number[] };
const PLANS: readonly Plan[] = [
  { name: "Started", price: "$199/mo", included: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: "Recruited", price: "$499/mo", included: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1] },
  { name: "Enrolled Pro+", price: "$799/mo", included: [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1] },
  { name: "Full Service", price: "$2,500/mo", full: true, included: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
];

export function PricingPage() {
  return (
    <Page size="LETTER" style={s.page}>
      <Text style={s.eyebrow}>SUMMARY</Text>
      <Text style={s.h1}>
        Support That Matches Your <Text style={s.h1Accent}>School's Needs</Text>
      </Text>
      <Text style={s.sub}>(Single site pricing)</Text>

      <View style={s.table}>
        <View style={s.headRow}>
          <View style={s.featureCell} />
          {PLANS.map((p) => (
            <View key={p.name} style={s.planCell}>
              <Text style={p.full ? [s.planHeadName, s.planHeadFull] : s.planHeadName}>{p.name}</Text>
              <Text style={s.planHeadPrice}>{p.price}</Text>
            </View>
          ))}
        </View>

        {FEATURES.map((feature, i) => (
          <View key={feature} style={i === FEATURES.length - 1 ? [s.row, s.rowLast] : s.row}>
            <View style={s.featureCell}>
              <Text style={s.featureText}>{feature}</Text>
            </View>
            {PLANS.map((p) => (
              <View key={p.name} style={s.planCell}>
                <CheckMark ok={!!p.included[i]} />
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={s.footer}>
        <Text style={s.footerTitle}>MONTH-TO-MONTH PARTNERSHIPS</Text>
        <Text style={s.footerBody}>
          We believe in earning trust, not locking it in. Our partners stay with us because they
          see real results, not because they're tied to long-term contracts.
        </Text>
      </View>
    </Page>
  );
}
