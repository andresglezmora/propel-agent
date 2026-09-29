import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { color, space, font } from "../theme";
import { PillarHeader, Starburst } from "../components";

const s = StyleSheet.create({
  page: { fontFamily: font.display, color: color.ink, paddingHorizontal: space.s6, paddingVertical: 38 },
  body: { fontSize: 10, lineHeight: 1.48, color: "#3a3a4a", marginBottom: 22 },

  row: { flexDirection: "row", gap: space.s4, alignItems: "center", marginBottom: 26 },
  imgWrap: { width: 210, height: 145, position: "relative" },
  shot: { width: 210, height: 145, objectFit: "cover", borderRadius: 8, borderWidth: 1, borderColor: "#eaeaf0" },
  badgeTR: { position: "absolute", top: -18, right: -18 },
  badgeTL: { position: "absolute", top: -18, left: -18 },

  textCol: { flex: 1 },
  numLabel: { fontSize: 9, fontWeight: 700, color: color.muted, marginBottom: 2 },
  title: { fontSize: 13.5, fontWeight: 700, marginBottom: 4 },
  intro: { fontSize: 9, color: "#5b5b6e", marginBottom: 6, lineHeight: 1.4 },
  givesYou: { fontSize: 9, fontWeight: 700, color: color.ink, marginBottom: 5 },
  bulletRow: { flexDirection: "row", gap: 5, marginBottom: 3, alignItems: "center" },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: color.green },
  bulletText: { fontSize: 8.8, color: "#3a3a4a" },
});

const SECTIONS = [
  {
    n: 1,
    icon: "users" as const,
    title: "Organize Every Family",
    intro: "Stop searching inboxes. Stop guessing who needs a call. Stop losing opportunities.",
    bullets: ["A visual enrollment pipeline", "Clear follow-up stages", "Automated task assignments", "Built-in reminders"],
  },
  {
    n: 2,
    icon: "translate" as const,
    title: "Follow Up Faster — In Any Language",
    intro: "Families enroll where they feel seen, understood, and responded to quickly. Enroll(ED) allows your team to communicate confidently with every family — regardless of language.",
    bullets: ["AI-powered message drafting in all languages", "Instant translation for texts and emails", "Automated follow-up sequences", "Smart reminders for tours and calls"],
  },
  {
    n: 3,
    icon: "magnifying-glass" as const,
    title: "Know What's Working",
    intro: "Stop guessing which efforts drive enrollment. You'll know exactly where families are coming from — and what's converting.",
    bullets: ["Campaign tracking", "Conversion visibility", "Team performance insights", "Clear ROI reporting"],
  },
] as const;

export function RobustCrmPage({ photos }: { photos: [string, string, string] }) {
  return (
    <Page size="LETTER" style={s.page}>
      <PillarHeader n="02." title="ROBUST CRM" sub="Every Family Captured. No Lead Left Behind." />
      <Text style={s.body}>
        Our enrollment CRM is purpose-built for school recruitment — combining lead scoring,
        automated follow-up, SMS, and email into one system designed to move families from top of
        funnel to fully enrolled within 24–72 hours.
      </Text>

      {SECTIONS.map((sec, i) => {
        const reverse = i % 2 === 1;
        const image = (
          <View style={s.imgWrap}>
            <Image src={photos[i]} style={s.shot} />
            <View style={reverse ? s.badgeTL : s.badgeTR}>
              <Starburst icon={sec.icon} size={56} />
            </View>
          </View>
        );
        const text = (
          <View style={s.textCol}>
            <Text style={s.numLabel}>{String(sec.n).padStart(2, "0")}</Text>
            <Text style={s.title}>{sec.title}</Text>
            <Text style={s.intro}>{sec.intro}</Text>
            <Text style={s.givesYou}>Enroll(ED) gives you:</Text>
            {sec.bullets.map((b) => (
              <View key={b} style={s.bulletRow}>
                <View style={s.bulletDot} />
                <Text style={s.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        );
        return (
          <View key={sec.n} style={s.row}>
            {reverse ? (
              <>
                {text}
                {image}
              </>
            ) : (
              <>
                {image}
                {text}
              </>
            )}
          </View>
        );
      })}
    </Page>
  );
}
