import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { color, space, font } from "../theme";
import { PillarHeader, IconRing } from "../components";

const s = StyleSheet.create({
  page: { fontFamily: font.display, color: color.ink, paddingHorizontal: space.s6, paddingVertical: 40 },
  body: { fontSize: 10.3, lineHeight: 1.52, color: "#3a3a4a", marginBottom: 18, maxWidth: 460 },
  // "cover" recortaba la foto (el ancho completo de la página es más
  // panorámico que la foto original, así que top/bottom se comían parte de
  // la escena). "contain" muestra la imagen completa, sin cortar nada.
  hero: { width: "100%", height: 225, objectFit: "contain", marginBottom: 18 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 24 },
  card: { width: "47%", gap: 8 },
  cardTitle: { fontSize: 12, fontWeight: 700, marginTop: 4 },
  cardAccent: { color: color.coral },
  cardBody: { fontSize: 9.5, lineHeight: 1.5, color: "#5b5b6e" },
});

const FEATURES = [
  { icon: "target", accent: "Targeted", rest: " ad campaigns", body: "Meta, Google, TikTok and programmatic campaigns built specifically for student recruitment, targeting families by location, school interest, and enrollment stage." },
  { icon: "browser", accent: "High-converting", rest: " landing pages", body: "Custom-built pages for each school or campaign that turn clicks into form submissions, designed to capture the right families at the right moment." },
  { icon: "funnel", accent: "Full funnel", rest: " visibility", body: "Every lead is tracked from first click to enrollment. You always know where families came from, how they moved through the funnel, and what converted them." },
  { icon: "trend-up", accent: "Continuous", rest: " optimization", body: "We monitor performance daily and make real-time adjustments to maximize lead volume and quality, reducing cost-per-lead over time." },
] as const;

export function LeadGenPage({ photo }: { photo: string }) {
  return (
    <Page size="LETTER" style={s.page}>
      <PillarHeader n="01." title="LEAD GENERATION" sub="High-Performing Campaigns, Fully Managed for You" />
      <Text style={s.body}>
        We manage and oversee every aspect of your lead generation — from campaign strategy and
        ad creative to audience targeting and optimization — so your team never has to worry
        about where the next family is coming from.
      </Text>

      <Image src={photo} style={s.hero} />

      <View style={s.grid}>
        {FEATURES.map((f) => (
          <View key={f.accent} style={s.card}>
            <IconRing icon={f.icon as any} size={34} />
            <Text style={s.cardTitle}>
              <Text style={s.cardAccent}>{f.accent}</Text>
              {f.rest}
            </Text>
            <Text style={s.cardBody}>{f.body}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}
