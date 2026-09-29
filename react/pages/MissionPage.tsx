import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { color, space, font, PAGE } from "../theme";
import type { ImgSrc } from "../imgSrc";
import { NumberBadge, Callout, IconRing } from "../components";

export type MissionPageProps = {
  schoolName: string;
  photo: ImgSrc;
};

const s = StyleSheet.create({
  page: {
    fontFamily: font.display,
    color: color.ink,
    paddingHorizontal: space.s6,
    paddingVertical: 44,
  },
  h1: { fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: space.s3 },
  h1Accent: { color: color.coral },
  subhead: { fontSize: 14, fontWeight: 700, color: color.purple, marginBottom: space.s2 },
  body: { fontSize: 10.2, lineHeight: 1.48, color: "#3a3a4a", marginBottom: 10 },
  strong: { fontWeight: 700, color: color.ink },

  calloutTitle: { fontSize: 11, fontWeight: 700, color: color.purple, marginBottom: 4 },
  calloutBody: { fontSize: 9.5, lineHeight: 1.45, color: "#3a3a4a" },

  row: { flexDirection: "row", gap: space.s4, marginTop: 14 },
  col: { flex: 1.15 },
  photoCol: { flex: 0.85 },
  photo: { width: "100%", height: 260, borderRadius: 8, objectFit: "cover" },

  item: { flexDirection: "row", gap: space.s2, marginBottom: 10 },
  itemTitle: { fontSize: 11.5, fontWeight: 700, marginBottom: 2 },
  itemBody: { fontSize: 9.3, lineHeight: 1.45, color: "#5b5b6e" },

  closing: { fontSize: 9.3, lineHeight: 1.4, color: "#3a3a4a", marginTop: 4 },
});

export function MissionPage({ schoolName, photo }: MissionPageProps) {
  return (
    <Page size="LETTER" style={s.page}>
      <Text style={s.h1}>
        OUR <Text style={s.h1Accent}>MISSION</Text>
      </Text>
      <Text style={s.subhead}>Building Clarity, Capacity, and Full Enrollment</Text>
      <Text style={s.body}>
        <Text style={s.strong}>Your Full-Service Enrollment Team. </Text>
        TrustED Solutions is your full-service student recruitment team — from first lead to
        enrolled. We build and manage the systems behind enrollment — from marketing and design
        to outreach, CRM, and data — ensuring every family is engaged and every opportunity is
        captured.
      </Text>
      <Text style={s.body}>
        We work with a select number of schools nationwide, ensuring every partner receives{" "}
        <Text style={s.strong}>
          personalized attention, consistent communication, and data-driven results.
        </Text>
      </Text>
      <Text style={s.body}>
        Our approach blends technology and hands-on expertise,{" "}
        <Text style={s.strong}>
          combining CRM automation, outreach management, and storytelling to create enrollment
          systems that work.
        </Text>
      </Text>

      <Callout>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <IconRing icon="shield-check" size={20} />
          <Text style={s.calloutTitle}>WHY SCHOOLS CHOOSE TRUSTED</Text>
        </View>
        <Text style={s.calloutBody}>
          Unlike other organizations, we price our services to help struggling schools break out
          of enrollment decline, not worsen their situation with long-term, inflexible contracts.
          That's why we operate on a{" "}
          <Text style={{ fontWeight: 700, color: color.ink }}>
            month-to-month model ensuring schools can see results and retain flexibility as they
            regain momentum.
          </Text>
        </Text>
      </Callout>

      <View style={s.row}>
        <View style={s.col}>
          <Text style={[s.body, { marginTop: 0 }]}>
            By integrating people, processes, and platforms, {schoolName} gains:
          </Text>

          <View style={s.item}>
            <NumberBadge n={1} />
            <View style={{ flex: 1 }}>
              <Text style={s.itemTitle}>CLARITY</Text>
              <Text style={s.itemBody}>
                Real-time, district-wide visibility into enrollment, retention, and marketing
                performance.
              </Text>
            </View>
          </View>

          <View style={s.item}>
            <NumberBadge n={2} />
            <View style={{ flex: 1 }}>
              <Text style={s.itemTitle}>CAPACITY</Text>
              <Text style={s.itemBody}>
                Dedicated specialists and automated workflows that ensure no family or lead falls
                through the cracks.
              </Text>
            </View>
          </View>

          <View style={s.item}>
            <NumberBadge n={3} />
            <View style={{ flex: 1 }}>
              <Text style={s.itemTitle}>CONFIDENCE</Text>
              <Text style={s.itemBody}>
                Data-backed insights that allow {schoolName} leadership to anticipate challenges,
                allocate resources effectively, and support schools proactively.
              </Text>
            </View>
          </View>
        </View>

        <View style={s.photoCol}>
          <Image src={photo} style={s.photo} />
        </View>
      </View>

      <Text style={s.closing}>
        <Text style={s.strong}>
          With nearly two decades of experience helping schools across the country achieve and
          sustain full enrollment,{" "}
        </Text>
        TrustED Solutions understands what it takes to build lasting growth and stability. This
        proposal outlines a strategic, cost-effective path for {schoolName} to reach full
        enrollment while putting in place the systems, processes, and insights that empower
        leadership to make smarter, faster, and more informed decisions for long-term success.
      </Text>
    </Page>
  );
}
