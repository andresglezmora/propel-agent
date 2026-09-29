import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { color, space, font, PAGE } from "../theme";
import type { ImgSrc } from "../imgSrc";

export type CoverPageProps = {
  schoolName: string;
  date: string;
  coverPhoto: ImgSrc;
  logoDark: string;
  /** false para una escuela de un solo campus: oculta "Network-wide" (PRD
   * sección 5/14 — la tabla completa de frases de red sigue pendiente de
   * aprobación, esta es la única ya resuelta con el usuario). */
  networkWide?: boolean;
};

// Composición en 3 franjas apiladas, NUNCA superpuestas entre sí — así el
// título siempre es legible (vive en su propia franja clara) y la foto
// nunca queda tapada por texto ni por el acento morado (una cara cubierta
// por una forma fue justo el problema del intento anterior). Referencia:
// portada que mandó el usuario (círculo orgánico + foto completa abajo +
// franja de contacto).
const TOP_H = PAGE.height * 0.42;
const FOOTER_H = 56;
const PHOTO_H = PAGE.height - TOP_H - FOOTER_H;
const LOGO_RATIO = 1698 / 421;

const styles = StyleSheet.create({
  page: { fontFamily: font.display, color: color.ink },

  top: {
    height: TOP_H,
    backgroundColor: "#f6f4fa", // lavanda muy pálido, no el blanco puro de --lavender
    position: "relative",
    overflow: "hidden",
    justifyContent: "space-between",
    paddingHorizontal: space.s6,
    paddingVertical: space.s5,
  },
  logo: { width: 26 * LOGO_RATIO, height: 26, objectFit: "contain" },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    color: color.purple,
    marginTop: space.s1,
  },
  titleAccent: { fontSize: 15, fontWeight: 700, color: color.coral, letterSpacing: -1 },
  title: {
    fontSize: 30,
    fontWeight: 800,
    color: color.ink,
    lineHeight: 1.18,
    maxWidth: 380,
    letterSpacing: -1,
  },

  photoWrap: { height: PHOTO_H, width: PAGE.width },
  photo: { width: PAGE.width, height: PHOTO_H, objectFit: "cover" },

  footer: {
    height: FOOTER_H,
    backgroundColor: color.purpleDark,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.s6,
  },
  footerCol: { flex: 1 },
  footerLabel: { fontSize: 9, fontWeight: 700, color: color.violet, marginBottom: 2 },
  footerValue: { fontSize: 11, fontWeight: 500, color: color.white },
});

export function CoverPage({ schoolName, date, coverPhoto, logoDark, networkWide = true }: CoverPageProps) {
  return (
    <Page size="LETTER" style={styles.page}>
      {/* Franja 1: identidad + título, sobre fondo claro. Sin ornamento de
          fondo: el círculo no aportaba nada aquí, mejor limpio. */}
      <View style={styles.top}>
        <View>
          <Image src={logoDark} style={styles.logo} />
          <Text style={styles.eyebrow}>FULL-SERVICE ENROLLMENT PROPOSAL</Text>
        </View>

        <View>
          {networkWide && <Text style={styles.titleAccent}>Network-wide{"\n"}</Text>}
          <Text style={styles.title}>Full-Service: Student{"\n"}Recruitment Support</Text>
        </View>
      </View>

      {/* Franja 2: la foto, completa, sin nada encima. */}
      <View style={styles.photoWrap}>
        <Image src={coverPhoto} style={styles.photo} />
      </View>

      {/* Franja 3: los datos, como el pie de contacto de la referencia. */}
      <View style={styles.footer}>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>PREPARED FOR</Text>
          <Text style={styles.footerValue}>{schoolName}</Text>
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>PREPARED BY</Text>
          <Text style={styles.footerValue}>TrustED Solutions</Text>
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>DATE</Text>
          <Text style={styles.footerValue}>{date}</Text>
        </View>
      </View>
    </Page>
  );
}
