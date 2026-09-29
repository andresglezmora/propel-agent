import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { color, space, font } from "../theme";
import type { ImgSrc } from "../imgSrc";
import { IconRing } from "../components";

const s = StyleSheet.create({
  page: {
    fontFamily: font.display,
    color: color.ink,
    paddingHorizontal: space.s6,
    paddingVertical: 44,
  },
  headRow: { flexDirection: "row", gap: space.s4, marginBottom: 26 },
  headText: { flex: 1.3 },
  h1: { fontSize: 22, fontWeight: 700, letterSpacing: -1, lineHeight: 1.2, marginBottom: space.s3 },
  h1Bold: { fontWeight: 800 },
  body: { fontSize: 9.8, lineHeight: 1.5, color: "#3a3a4a", marginBottom: 12 },
  strong: { fontWeight: 700, color: color.ink },
  photo: { flex: 1, height: 210, borderRadius: 8, objectFit: "cover" },

  row: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#eeecf3",
    borderRadius: 6,
    padding: 15,
    marginBottom: 13,
    alignItems: "center",
  },
  rowTitle: { fontSize: 10.5, fontWeight: 700, marginBottom: 2 },
  rowTitleAccent: { color: color.coral },
  rowBody: { fontSize: 9, lineHeight: 1.4, color: "#5b5b6e" },
});

const ROWS = [
  {
    icon: "house",
    lead: "DEEPLY UNDERSTAND",
    rest: " THEIR SCHOOL",
    body: "It manages through real-time insights into enrollment, retention, attrition, and lead conversion.",
  },
  {
    icon: "sparkle",
    lead: "CENTRALIZE EFFORTS",
    rest: " ACROSS THE ORGANIZATION",
    body: "Eliminating redundant tools and fragmented spreadsheets.",
  },
  {
    icon: "chart-line-up",
    lead: "INCREASE ACCOUNTABILITY",
    rest: " AND TRANSPARENCY",
    body: "So every leader — from school principals to district executives — sees exactly where progress is being made and where additional support is required.",
  },
  {
    icon: "users-three",
    lead: "DIRECTLY IMPROVE",
    rest: " ENROLLMENT",
    body: "By ensuring no family inquiry is left unanswered, every lead is nurtured, and every dollar spent is tied to measurable ROI.",
  },
  {
    icon: "gear",
    lead: "STRENGTHEN LONG-TERM",
    rest: " SUSTAINABILITY",
    body: "Not just by filling seats today, but by building repeatable systems that increase retention and financial stability year over year.",
  },
] as const;

export function CentralizedPage({ schoolName, photo }: { schoolName: string; photo: ImgSrc }) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.headRow}>
        <View style={s.headText}>
          <Text style={s.h1}>
            Centralized Enrollment{"\n"}
            <Text style={s.h1Bold}>& Operations System</Text>
          </Text>
          <Text style={s.body}>
            The challenge today is that enrollment, marketing, data, and operations often sit in
            silos, making it difficult for leadership to see the whole picture or to act quickly
            when a campus needs intervention.
          </Text>
          <Text style={s.body}>
            This proposal establishes a{" "}
            <Text style={s.strong}>comprehensive, centralized system</Text> that does far more
            than track numbers. It brings together data systems, people, and processes into one
            coordinated platform that enables <Text style={s.strong}>{schoolName}</Text> to:
          </Text>
        </View>
        <Image src={photo} style={s.photo} />
      </View>

      {ROWS.map((r) => (
        <View key={r.lead} style={s.row}>
          <IconRing icon={r.icon as any} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>
              <Text style={s.rowTitleAccent}>{r.lead}</Text>
              {r.rest}
            </Text>
            <Text style={s.rowBody}>{r.body}</Text>
          </View>
        </View>
      ))}
    </Page>
  );
}
