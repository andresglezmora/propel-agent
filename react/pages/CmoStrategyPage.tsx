import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { color, space, font } from "../theme";
import { PillarHeader, IconRing } from "../components";
import { campusCopy, copyOrText, type CampusMode } from "../campusCopy";

const s = StyleSheet.create({
  page: { fontFamily: font.display, color: color.ink, paddingHorizontal: space.s6, paddingVertical: 36 },
  // "cover" recortaba la imagen (el ancho de la página es más panorámico
  // que la foto). "contain" la muestra completa.
  photo: { width: "100%", height: 230, objectFit: "contain", borderRadius: 8, marginBottom: 22 },
  body: { fontSize: 10.3, lineHeight: 1.52, color: "#3a3a4a", marginBottom: 22, maxWidth: 460 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  card: { width: "47%", gap: 8 },
  cardTitle: { fontSize: 12, fontWeight: 700, marginTop: 4 },
  cardBody: { fontSize: 9.5, lineHeight: 1.5, color: "#5b5b6e" },
});

const ITEMS = [
  { icon: "magnifying-glass", title: "Market Analysis", body: "cmo.marketAnalysis" },
  { icon: "calendar", title: "Enrollment Calendar Planning", body: "We map out every key enrollment milestone — open houses, application deadlines, lottery dates — and build campaign timelines around them so nothing is ever reactive." },
  { icon: "calendar-check", title: "Quarterly Reviews", body: "Regular strategy sessions with your leadership to review performance, adjust campaigns, and set targets for the next enrollment cycle." },
  { icon: "heart", title: "Retention Strategy", body: "Enrollment doesn't end at signup. We help you build campaigns that keep families engaged, reduce attrition, and turn enrolled families into your best recruiters." },
] as const;

export function CmoStrategyPage({ schoolName, photo, campusMode = "network" }: { schoolName: string; photo: string; campusMode?: CampusMode }) {
  return (
    <Page size="LETTER" style={s.page}>
      <Image src={photo} style={s.photo} />
      <PillarHeader n="06." title="CMO-LEVEL STRATEGY" sub="We Don't Just Execute. We Think Like Your CMO." />
      <Text style={s.body}>
        {campusMode === "network" ? "Every " : ""}
        {schoolName}
        {`${campusMode === "network" ? " campus gets" : " gets"} a dedicated enrollment strategy — built around your market, your goals, and your competitive landscape. We bring the senior-level marketing ${campusCopy(campusMode, "cmo.hireEnd")}`}
      </Text>
      <View style={s.grid}>
        {ITEMS.map((it) => (
          <View key={it.title} style={s.card}>
            <IconRing icon={it.icon as any} size={36} />
            <Text style={s.cardTitle}>{it.title}</Text>
            <Text style={s.cardBody}>{copyOrText(campusMode, it.body)}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
}
