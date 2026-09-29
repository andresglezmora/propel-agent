import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { color, space, font } from "../theme";
import { PillarHeader, Pill } from "../components";

const s = StyleSheet.create({
  page: { fontFamily: font.display, color: color.ink, paddingHorizontal: space.s6, paddingVertical: 40 },
  body: { fontSize: 10, lineHeight: 1.5, color: "#3a3a4a", marginBottom: 16 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 18 },
  collage: { width: "100%", height: 300, objectFit: "contain", marginBottom: 18 },

  callout: { backgroundColor: "#eeecf3", borderRadius: 8, padding: 18, marginTop: 4 },
  calloutLabel: { fontSize: 10, fontWeight: 700, color: color.purple, marginBottom: 6 },
  calloutTitle: { fontSize: 12.5, fontWeight: 700, marginBottom: 6 },
  calloutBody: { fontSize: 9.8, lineHeight: 1.55, color: "#3a3a4a" },
});

const ASSETS = [
  "Posters & Flyers", "Websites", "Landing Pages", "Folders & Packets",
  "Email Templates", "Billboards", "Social Media Graphics", "Yard Signs", "Event Materials",
] as const;

export function MarketingDesignPage({ schoolName, photo }: { schoolName: string; photo: string }) {
  return (
    <Page size="LETTER" style={s.page}>
      <PillarHeader n="05." title="FULL MARKETING DESIGN" sub="Every Asset. Every Channel. One Cohesive Brand." />
      <Text style={s.body}>
        From posters and yard signs to full websites and billboards, we create every marketing
        asset your schools need — ensuring your brand is consistent, professional, and compelling
        from online to in-person.
      </Text>
      <Image src={photo} style={s.collage} />

      <View style={s.pillRow}>
        {ASSETS.map((a) => (
          <Pill key={a}>{a}</Pill>
        ))}
      </View>

      <View style={s.callout}>
        <Text style={s.calloutLabel}>WHY THIS MATTERS</Text>
        <Text style={s.calloutTitle}>Consistent Branding = Trust</Text>
        <Text style={s.calloutBody}>
          Families make decisions about schools before they ever walk through the door. When
          every touchpoint — from a yard sign to a landing page — looks professional and
          cohesive, it signals quality. Disconnected, inconsistent design erodes trust. We make
          sure {schoolName} always puts its best face forward, everywhere.
        </Text>
      </View>
    </Page>
  );
}
