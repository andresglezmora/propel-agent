import { registerFonts } from "./fonts";
import { assetPath, ensureAssets } from "./assets";
import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { CoverPage } from "./pages/CoverPage";
import { MissionPage } from "./pages/MissionPage";
import { PartnerPage } from "./pages/PartnerPage";
import { CentralizedPage } from "./pages/CentralizedPage";
import { PricingPage } from "./pages/PricingPage";
import { LeadGenPage } from "./pages/LeadGenPage";
import { RobustCrmPage } from "./pages/RobustCrmPage";
import { ParentOutreachPage } from "./pages/ParentOutreachPage";
import { DataDashboardsPage } from "./pages/DataDashboardsPage";
import { MarketingDesignPage } from "./pages/MarketingDesignPage";
import { CmoStrategyPage } from "./pages/CmoStrategyPage";
import { CostComparisonPage } from "./pages/CostComparisonPage";
import { TestimonialsPage } from "./pages/TestimonialsPage";
import { AgreementCoverPage } from "./pages/AgreementCoverPage";
import { AgreementPage } from "./pages/AgreementPage";
import type { ImgSrc } from "./imgSrc";

const asset = assetPath;

// Los assets FIJOS de TrustED (logos, capturas de producto, fotos de
// TrustED, logos de los testimonios) nunca cambian de escuela a escuela —
// viven en el repo, no se piden por escuela. Solo 3 fotos son por-escuela
// (ver ProposalInput.photos abajo): portada, misión y la de "Centralized
// Enrollment" — el diseño de la página de testimonios ya no lleva foto
// propia (quedó como cita + tarjetas), así que ese tercer espacio del PRD
// original ("testimonials") se reasignó a Centralized Enrollment, que sí
// tiene un hueco de foto real en este layout.
const FIXED = {
  logoDark: asset("brand/trusted-logo-dark.png"),
  logoWhite: asset("brand/trusted-logo-white.png"),
  robustCrmShots: [
    asset("template/full-service/uploads/img10.png"),
    asset("template/full-service/uploads/img9.png"),
    asset("template/full-service/uploads/img8.png"),
  ] as [string, string, string],
  leadGenPhoto: asset("template/full-service/uploads/img16.png"),
  parentOutreachPhoto: asset("template/full-service/uploads/img17.png"),
  dataDashboardsShots: [
    asset("template/full-service/uploads/img11.png"),
    asset("template/full-service/uploads/img12.png"),
    asset("template/full-service/uploads/img13.png"),
  ] as [string, string, string],
  marketingDesignPhoto: asset("template/full-service/uploads/img14.png"),
  cmoStrategyPhoto: asset("template/full-service/uploads/img15.png"),
  testimonialLogos: {
    phalen: asset("template/full-service/assets/img_286.png"),
    aspire: asset("template/full-service/assets/img_1544.png"),
    afia: asset("template/full-service/assets/img_1547.png"),
  },
};

export type ProposalInput = {
  schoolName: string;
  schoolPossessive: string;
  date: string; // "September 25, 2026" — ya formateada
  campusMode: "single" | "network";
  /** Rutas locales absolutas a las 3 fotos por-escuela, ya elegidas
   * (harvest_site_photos / generate_ai_photo / set_slot_photo las dejan
   * aquí antes de llamar a render_proposal). */
  photos: {
    cover: ImgSrc;
    mission: ImgSrc;
    centralized: ImgSrc;
  };
};

export function buildProposalDocument(input: ProposalInput) {
  const networkWide = input.campusMode === "network";
  return (
    <Document>
      <CoverPage
        schoolName={input.schoolName}
        date={input.date}
        coverPhoto={input.photos.cover}
        logoDark={FIXED.logoDark}
        networkWide={networkWide}
      />
      <MissionPage schoolName={input.schoolName} photo={input.photos.mission} />
      <PartnerPage schoolName={input.schoolName} campusMode={input.campusMode} />
      <CentralizedPage schoolName={input.schoolName} photo={input.photos.centralized} />
      <PricingPage />
      <LeadGenPage photo={FIXED.leadGenPhoto} />
      <RobustCrmPage photos={FIXED.robustCrmShots} />
      <ParentOutreachPage photo={FIXED.parentOutreachPhoto} />
      <DataDashboardsPage schoolName={input.schoolName} photos={FIXED.dataDashboardsShots} />
      <MarketingDesignPage schoolName={input.schoolName} photo={FIXED.marketingDesignPhoto} />
      <CmoStrategyPage schoolName={input.schoolName} photo={FIXED.cmoStrategyPhoto} />
      <CostComparisonPage logoDark={FIXED.logoDark} />
      <TestimonialsPage
        phalenLogo={FIXED.testimonialLogos.phalen}
        aspireLogo={FIXED.testimonialLogos.aspire}
        afiaLogo={FIXED.testimonialLogos.afia}
      />
      <AgreementCoverPage logoWhite={FIXED.logoWhite} />
      <AgreementPage schoolName={input.schoolName} possessive={input.schoolPossessive} />
    </Document>
  );
}

export async function renderProposalPdf(input: ProposalInput): Promise<Buffer> {
  // En Vercel los assets fijos (fuentes, logos, capturas) no vienen en el
  // bundle: se bajan de Storage a /tmp la primera vez (ver assets.ts).
  await ensureAssets();
  registerFonts();
  return renderToBuffer(buildProposalDocument(input));
}

/** Assets de referencia (PROUD Academy) para pruebas locales sin depender
 * de un scraping/generación real — usados por scripts/render_local.tsx y
 * por los evals de la fase 0. */
export const SAMPLE_PHOTOS = {
  cover: asset("template/full-service/assets/img_934_duotone.png"),
  mission: asset("template/full-service/assets/img_968.png"),
  centralized: asset("template/full-service/assets/img_102.png"),
};
