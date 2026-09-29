import React from "react";
import { Page, View, Text, Image, Svg, Defs, LinearGradient, Stop, Rect, StyleSheet } from "@react-pdf/renderer";
import { color, space, font, PAGE } from "../theme";
import { PillarHeader, IconRing } from "../components";

const FOOTER_W = PAGE.width - space.s6 * 2;

const s = StyleSheet.create({
  page: { fontFamily: font.display, color: color.ink, paddingHorizontal: space.s6, paddingVertical: 38 },
  topRow: { flexDirection: "row", gap: space.s4, marginBottom: 26 },
  headCol: { flex: 1.3 },
  body: { fontSize: 10, lineHeight: 1.5, color: "#3a3a4a", marginTop: 10 },
  photo: { width: 165, height: 225, objectFit: "cover", borderRadius: 8 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 24 },
  card: { width: "47%", backgroundColor: "#f3f1f8", borderRadius: 8, padding: 16, gap: 6 },
  cardTitle: { fontSize: 11.5, fontWeight: 700, color: color.purple, marginTop: 2 },
  cardBody: { fontSize: 9, lineHeight: 1.42, color: "#5b5b6e" },

  footer: { backgroundColor: color.navy, borderRadius: 8, overflow: "hidden" },
  footerInner: { alignItems: "center", paddingVertical: 26, paddingHorizontal: 20 },
  statNum: { fontSize: 32, fontWeight: 800, color: color.coral, letterSpacing: -1, marginTop: 8 },
  statLabel: { fontSize: 9.5, color: "#c9c9e0", textAlign: "center", marginTop: 8, maxWidth: 380 },
});

const CARDS = [
  { icon: "phone-call", title: "Immediate Contact", body: "We reach out to every new lead within minutes of submission — no family waits." },
  { icon: "arrows-clockwise", title: "Nurture & Re-Engage", body: "Families who aren't ready yet are kept warm through consistent follow-up until they are." },
  { icon: "magnifying-glass", title: "Qualification", body: "Our team asks the right questions to determine genuine interest and eligibility before anyone reaches your staff." },
  { icon: "handshake", title: "Warm Handoff", body: "Only pre-qualified, genuinely interested families are handed to your admissions team, ready to enroll." },
] as const;

export function ParentOutreachPage({ photo }: { photo: string }) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={s.topRow}>
        <View style={s.headCol}>
          <PillarHeader n="03." title="PARENT OUTREACH" sub="We Call. We Qualify. We Deliver Ready Families." />
          <Text style={s.body}>
            Our dedicated outreach team contacts every incoming lead on your behalf — making sure
            only truly interested, qualified families ever reach your admissions staff. This is
            one of our biggest differentiators.
          </Text>
        </View>
        <Image src={photo} style={s.photo} />
      </View>

      <View style={s.grid}>
        {CARDS.map((c) => (
          <View key={c.title} style={s.card}>
            <IconRing icon={c.icon as any} size={32} />
            <Text style={s.cardTitle}>{c.title}</Text>
            <Text style={s.cardBody}>{c.body}</Text>
          </View>
        ))}
      </View>

      <View style={s.footer}>
        <Svg width={FOOTER_W} height={4}>
          <Defs>
            <LinearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={color.coralLight} />
              <Stop offset="1" stopColor={color.violet} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={FOOTER_W} height={4} fill="url(#bar)" />
        </Svg>
        <View style={s.footerInner}>
          <IconRing icon="clock" size={30} />
          <Text style={s.statNum}>24–72hr</Text>
          <Text style={s.statLabel}>
            Our outreach team ensures every lead is contacted, qualified, and moving through your
            funnel within 24 to 72 hours — so no prospective family ever falls through the cracks.
          </Text>
        </View>
      </View>
    </Page>
  );
}
