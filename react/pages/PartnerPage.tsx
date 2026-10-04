import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { color, space, font } from "../theme";
import { NumberBadge, IconRing } from "../components";
import { campusCopy, copyOrText, type CampusMode } from "../campusCopy";

const s = StyleSheet.create({
  page: {
    fontFamily: font.display,
    color: color.ink,
    paddingHorizontal: space.s6,
    paddingVertical: 44,
  },
  h1: { fontSize: 24, fontWeight: 700, letterSpacing: -1, marginBottom: 2 },
  h1Bold: { fontWeight: 800 },
  subhead: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: color.purple,
    marginTop: 16,
    marginBottom: 14,
  },

  approachRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.s3,
    paddingVertical: 10,
    paddingHorizontal: space.s2,
    borderRadius: 4,
    marginBottom: 8,
  },
  approachRowAlt: { backgroundColor: "#f3f1f8" },
  approachLabel: { fontSize: 12, fontWeight: 700, marginBottom: 2 },
  approachBody: { fontSize: 9.3, lineHeight: 1.4, color: "#5b5b6e" },

  deliversHeading: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: -0.5,
    marginTop: 16,
    marginBottom: 14,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  card: {
    width: "47%",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 5,
  },
  cardTitle: { fontSize: 10.5, fontWeight: 700, marginBottom: 2 },
  cardBody: { fontSize: 8.8, lineHeight: 1.38, color: "#5b5b6e" },

  bottomLine: {
    marginTop: 14,
    backgroundColor: "#eeecf3",
    borderRadius: 6,
    padding: 16,
  },
  bottomLineLabel: { fontSize: 10, fontWeight: 700, color: color.purple, marginBottom: 4 },
  bottomLineBody: { fontSize: 9.5, lineHeight: 1.45, color: "#3a3a4a" },
});

const APPROACH = [
  { n: 1, label: "SOFTWARE", body: "To centralize leads, standardize data, automate follow-up, and provide live data dashboards." },
  { n: 2, label: "PEOPLE", body: "Dedicated outreach specialists, bilingual communicators, designers, and strategists — who extend the school's central team." },
  { n: 3, label: "PROCESSES", body: "partner.processes" },
] as const;

const DELIVERS = [
  { icon: "laptop", title: "A unified CRM", body: "That integrates with existing SIS platforms (PowerSchool, Infinite Campus, ProgressBook, etc.)." },
  { icon: "chart-bar", title: "Dashboards", body: "partner.dashboards" },
  { icon: "lightning", title: "Automated lead generation", body: "SMS/email campaigns and task management to ensure timely follow-up." },
  { icon: "megaphone", title: "Social media advertising", body: "Creation and reporting managed at scale." },
  { icon: "graduation-cap", title: "Professional development", body: "Training so school staff can confidently use the tools." },
  { icon: "shield-check", title: "Compliance", body: "With HIPAA/FERPA standards for secure data handling." },
  { icon: "chart-line-up", title: "Scalability", body: "partner.scalability" },
] as const;

export function PartnerPage({ schoolName, campusMode = "network" }: { schoolName: string; campusMode?: CampusMode }) {
  return (
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>
        A <Text style={s.h1Bold}>TrustED</Text> Partner
      </Text>
      <Text style={s.subhead}>OUR APPROACH COMBINES:</Text>

      {APPROACH.map((row, i) => (
        <View key={row.n} style={[s.approachRow, i % 2 === 0 ? s.approachRowAlt : undefined]}>
          <NumberBadge n={row.n} />
          <View style={{ flex: 1 }}>
            <Text style={s.approachLabel}>{row.label}</Text>
            <Text style={s.approachBody}>{copyOrText(campusMode, row.body)}</Text>
          </View>
        </View>
      ))}

      <Text style={s.deliversHeading}>WHAT THIS DELIVERS</Text>
      <View style={s.grid}>
        {DELIVERS.map((d) => (
          <View key={d.title} style={s.card}>
            <IconRing icon={d.icon as any} size={30} />
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{d.title}</Text>
              <Text style={s.cardBody}>{copyOrText(campusMode, d.body)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={s.bottomLine}>
        <Text style={s.bottomLineLabel}>BOTTOM LINE</Text>
        <Text style={s.bottomLineBody}>
          {`This is not a "tool" or a "dashboard" — it is an Enrollment & Operations Command Center ${campusCopy(campusMode, "partner.unifies")} transparent, accountable system. By centralizing insights and execution, `}
          {schoolName}{" "}
          gains the power to anticipate challenges, allocate resources strategically, and fill
          classrooms{campusCopy(campusMode, "partner.classroomsEnd")}.
        </Text>
      </View>
    </Page>
  );
}
