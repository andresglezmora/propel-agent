import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { color, space, font } from "../theme";
import { PillarHeader, Pill, IconRing } from "../components";
import { campusCopy, dashboardPills, type CampusMode } from "../campusCopy";

const s = StyleSheet.create({
  page: { fontFamily: font.display, color: color.ink, paddingHorizontal: space.s6, paddingVertical: 36 },
  body: { fontSize: 10, lineHeight: 1.5, color: "#3a3a4a", marginBottom: 16 },

  shotsRow: { flexDirection: "row", gap: 14, marginBottom: 16 },
  shotTall: { width: 220, height: 280, objectFit: "cover", borderRadius: 6, borderWidth: 1, borderColor: "#eaeaf0" },
  shotStack: { flex: 1, gap: 14 },
  shotWide: { width: "100%", height: 133, objectFit: "cover", borderRadius: 6, borderWidth: 1, borderColor: "#eaeaf0" },

  // Empacadas de izquierda a derecha (flexWrap simple), no una grilla de
  // columnas fijas al 50%: eso dejaba un hueco enorme antes de la segunda
  // columna cuando la primera pill era corta. Así quedan pegadas, como en
  // Full Marketing Design.
  pillGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },

  row: { flexDirection: "row", gap: 16 },
  card: { flex: 1, backgroundColor: "#f6f4fa", borderRadius: 8, padding: 16 },
  cardTitle: { fontSize: 11.5, fontWeight: 700, marginBottom: 5 },
  cardBody: { fontSize: 9, lineHeight: 1.42, color: "#5b5b6e" },
});

export function DataDashboardsPage({
  schoolName,
  photos,
  campusMode = "network",
}: {
  schoolName: string;
  campusMode?: CampusMode;
  photos: [string, string, string]; // [districtOverview, retentionSummary, enrollmentTracker]
}) {
  return (
    <Page size="LETTER" style={s.page}>
      <PillarHeader n="04." title="DATA DASHBOARDS" sub="All Your Data. One Clear Picture." />
      <Text style={s.body}>
        {`We aggregate data from your PowerSchool SIS and all marketing platforms into clean, easy-to-read dashboards — ${campusCopy(campusMode, "dashboards.audienceEnd")}`}
      </Text>

      <View style={s.shotsRow}>
        <Image src={photos[2]} style={s.shotTall} />
        <View style={s.shotStack}>
          <Image src={photos[0]} style={s.shotWide} />
          <Image src={photos[1]} style={s.shotWide} />
        </View>
      </View>

      <View style={s.pillGrid}>
        {dashboardPills(campusMode).map((p) => (
          <Pill key={p}>{p}</Pill>
        ))}
      </View>

      <View style={s.row}>
        <View style={s.card}>
          <IconRing icon="funnel" size={30} />
          <Text style={s.cardTitle}>Enrollment Funnel Tracking</Text>
          <Text style={s.cardBody}>
            {`See exactly how many leads are at each stage — inquiry, application, accepted, ${campusCopy(campusMode, "dashboards.funnelEnd")}`}
          </Text>
        </View>
        <View style={s.card}>
          <IconRing icon="chart-bar" size={30} />
          <Text style={s.cardTitle}>{campusCopy(campusMode, "dashboards.compareTitle")}</Text>
          <Text style={s.cardBody}>
            {`${campusCopy(campusMode, "dashboards.compareStart")} or campaign adjustments, so `}
            {schoolName}
            {" leadership can act early."}
          </Text>
        </View>
      </View>
    </Page>
  );
}
