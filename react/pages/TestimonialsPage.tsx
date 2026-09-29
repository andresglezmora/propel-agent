import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { color, space, font } from "../theme";
import { IconRing } from "../components";

const s = StyleSheet.create({
  page: { fontFamily: font.display, color: color.ink, paddingHorizontal: space.s6, paddingVertical: 42 },
  h1: { fontSize: 21, fontWeight: 800, letterSpacing: -1, textAlign: "center", marginBottom: 22 },
  h1Accent: { color: color.coral },

  featured: { backgroundColor: "#f6f4fa", borderRadius: 10, padding: 26, alignItems: "center", marginBottom: 24 },
  featuredQuote: { fontSize: 12, lineHeight: 1.65, color: "#3a3a4a", textAlign: "center", marginBottom: 16, maxWidth: 440 },
  featuredStrong: { fontWeight: 700, color: color.ink },
  featuredName: { fontSize: 13, fontWeight: 700, color: color.purple, marginTop: 6 },
  featuredRole: { fontSize: 10.5, color: color.muted, marginBottom: 14 },
  featuredLogo: { width: 52, height: 52, objectFit: "contain", marginTop: 4 },

  row: { flexDirection: "row", gap: space.s5 },
  card: { flex: 1, gap: 8, backgroundColor: "#fafafd", borderRadius: 10, padding: 16, borderWidth: 1, borderColor: "#eeecf3" },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  cardLogo: { width: 46, height: 46, objectFit: "contain" },
  cardName: { fontSize: 11.5, fontWeight: 700 },
  cardOrg: { fontSize: 9.3, color: color.muted, lineHeight: 1.4 },
  cardQuote: { fontSize: 9.8, lineHeight: 1.6, color: "#3a3a4a" },
  cardContact: { fontSize: 9.3, color: color.purple, fontWeight: 700, marginTop: 8 },
});

export function TestimonialsPage({
  phalenLogo,
  aspireLogo,
  afiaLogo,
}: {
  phalenLogo: string;
  aspireLogo: string;
  afiaLogo: string;
}) {
  return (
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>
        REFERENCES & <Text style={s.h1Accent}>TESTIMONIALS</Text>
      </Text>

      <View style={s.featured}>
        <IconRing icon="quotes" size={30} />
        <Text style={s.featuredQuote}>
          TrustED has transformed our enrollment operations{" "}
          <Text style={s.featuredStrong}>across 14 campuses with a solution truly built for our
          needs.</Text> Their team works with urgency, intentionality, and a rare level of
          partnership. <Text style={s.featuredStrong}>They don't just implement a system — they
          become part of your team.</Text> Because of TrustED, we now have greater clarity,
          real-time data, and simpler, stronger processes that help us better serve families.
        </Text>
        <Text style={s.featuredName}>— A. Minter</Text>
        <Text style={s.featuredRole}>School Leader, Phalen Leadership Academies</Text>
        <Image src={phalenLogo} style={s.featuredLogo} />
      </View>

      <View style={s.row}>
        <View style={s.card}>
          <View style={s.cardHead}>
            <Image src={aspireLogo} style={s.cardLogo} />
            <View>
              <Text style={s.cardName}>Gypsie Vazquez Ayala</Text>
              <Text style={s.cardOrg}>Aspire Public Schools{"\n"}Los Angeles, CA</Text>
            </View>
          </View>
          <Text style={s.cardQuote}>
            Working with TrustED has transformed how Aspire approaches enrollment. Their team
            supports multiple campuses with strategic systems, professional marketing assets, and
            dedicated family outreach. TrustED's diverse team truly understands the unique needs
            of our communities.
          </Text>
          <Text style={s.cardContact}>gypsie.VasquezAyala@aspirepublicschools.org</Text>
        </View>

        <View style={s.card}>
          <View style={s.cardHead}>
            <Image src={afiaLogo} style={s.cardLogo} />
            <View>
              <Text style={s.cardName}>Tricia DeGraff, Ph.D.</Text>
              <Text style={s.cardOrg}>Academy for Integrated Arts{"\n"}Kansas City, MO</Text>
            </View>
          </View>
          <Text style={s.cardQuote}>
            Enrollment numbers are looking really good, and part of that is because we now have
            better data than ever before. TrustED's work is making a positive difference — not
            only in recruitment, but in retention as well. Their team brings time, effort,
            expertise, and heart to the work.
          </Text>
          <Text style={s.cardContact}>tricia.degraff@afiakc.org</Text>
        </View>
      </View>
    </Page>
  );
}
