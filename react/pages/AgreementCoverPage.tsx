import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { color, space, font, PAGE } from "../theme";

const s = StyleSheet.create({
  page: {
    fontFamily: font.display,
    backgroundColor: color.purpleDark,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 26 * (1957 / 552), height: 26, objectFit: "contain", marginBottom: space.s5 },
  eyebrow: { fontSize: 11, fontWeight: 700, letterSpacing: 2, color: color.violet, marginBottom: 10 },
  title: { fontSize: 34, fontWeight: 800, letterSpacing: -1, color: color.white },
  rule: { width: 64, height: 3, backgroundColor: color.coral, borderRadius: 2, marginVertical: 18 },
  sub: { fontSize: 11, color: "#d8cfe8", textAlign: "center", maxWidth: 340, lineHeight: 1.5 },
});

export function AgreementCoverPage({ logoWhite }: { logoWhite: string }) {
  return (
    <Page size="LETTER" style={s.page}>
      <Image src={logoWhite} style={s.logo} />
      <Text style={s.eyebrow}>PART TWO</Text>
      <Text style={s.title}>SERVICE AGREEMENT</Text>
      <View style={s.rule} />
      <Text style={s.sub}>Building Clarity, Capacity, and Full Enrollment</Text>
    </Page>
  );
}
