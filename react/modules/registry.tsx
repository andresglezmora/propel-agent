import React from "react";
import { assetPath as asset } from "../assets";
import { CoverPage } from "../pages/CoverPage";
import { MissionPage } from "../pages/MissionPage";
import { PartnerPage } from "../pages/PartnerPage";
import { CentralizedPage } from "../pages/CentralizedPage";
import { PricingPage } from "../pages/PricingPage";
import { LeadGenPage } from "../pages/LeadGenPage";
import { RobustCrmPage } from "../pages/RobustCrmPage";
import { ParentOutreachPage } from "../pages/ParentOutreachPage";
import { DataDashboardsPage } from "../pages/DataDashboardsPage";
import { MarketingDesignPage } from "../pages/MarketingDesignPage";
import { CmoStrategyPage } from "../pages/CmoStrategyPage";
import { CostComparisonPage } from "../pages/CostComparisonPage";
import { TestimonialsPage } from "../pages/TestimonialsPage";
import { AgreementCoverPage } from "../pages/AgreementCoverPage";
import { AgreementPage } from "../pages/AgreementPage";
import type { ProposalModule } from "./types";
import { networkPricing, networkIncludes, networkFeeFrom } from "./network";
import { customModule, isCustomId } from "./custom";

// Los assets FIJOS de TrustED (logos, capturas de producto, fotos de TrustED,
// logos de los testimonios) nunca cambian de escuela a escuela. Solo las fotos
// de photoSlots son por escuela. Se resuelven al usarse (no al importar): en
// Vercel viven en /tmp y se descargan en ensureAssets.
const FIXED = {
  logoDark: () => asset("brand/trusted-logo-dark.png"),
  logoWhite: () => asset("brand/trusted-logo-white.png"),
  robustCrmShots: () =>
    [
      asset("template/full-service/optimized/img10.jpg"),
      asset("template/full-service/optimized/img9.jpg"),
      asset("template/full-service/optimized/img8.jpg"),
    ] as [string, string, string],
  leadGenPhoto: () => asset("template/full-service/optimized/img16.jpg"),
  parentOutreachPhoto: () => asset("template/full-service/optimized/img17.jpg"),
  dataDashboardsShots: () =>
    [
      asset("template/full-service/optimized/img11.jpg"),
      asset("template/full-service/optimized/img12.jpg"),
      asset("template/full-service/optimized/img13.jpg"),
    ] as [string, string, string],
  marketingDesignPhoto: () => asset("template/full-service/optimized/img14.jpg"),
  cmoStrategyPhoto: () => asset("template/full-service/optimized/img15.jpg"),
  testimonialLogos: () => ({
    phalen: asset("template/full-service/assets/img_286.png"),
    aspire: asset("template/full-service/assets/img_1544.png"),
    afia: asset("template/full-service/assets/img_1547.png"),
  }),
};

const list: ProposalModule[] = [
  {
    id: "cover",
    title: "Portada",
    description: "Nombre de la escuela, fecha y foto principal. En red agrega la línea \"Network-wide\".",
    pages: 1,
    photoSlots: [{ slot: "cover", minLongSide: 1200, description: "La foto más visible: alumnos en actividad real, horizontal." }],
    render: (ctx) => (
      <CoverPage
        schoolName={ctx.schoolName}
        date={ctx.date}
        coverPhoto={ctx.photos.cover}
        logoDark={FIXED.logoDark()}
        networkWide={ctx.campusMode === "network"}
      />
    ),
  },
  {
    id: "mission",
    title: "Misión",
    description: "Por qué TrustED y para quién, con foto de la escuela.",
    pages: 1,
    photoSlots: [{ slot: "mission", minLongSide: 800, description: "Alumnos con docentes, si el sitio lo tiene." }],
    render: (ctx) => <MissionPage schoolName={ctx.schoolName} photo={ctx.photos.mission} />,
  },
  {
    id: "partner",
    title: "Partner",
    description: "TrustED como socio de inscripción. En red menciona todos los campus.",
    pages: 1,
    render: (ctx) => <PartnerPage schoolName={ctx.schoolName} campusMode={ctx.campusMode} />,
  },
  {
    id: "centralized",
    title: "Centralized Enrollment",
    description: "Cómo se centraliza la inscripción, con foto de la comunidad escolar.",
    pages: 1,
    photoSlots: [{ slot: "centralized", minLongSide: 800, description: "Cualquier foto de la comunidad escolar." }],
    render: (ctx) => <CentralizedPage schoolName={ctx.schoolName} photo={ctx.photos.centralized} />,
  },
  {
    id: "pricing",
    title: "Precios de planes",
    description: "Tabla comparativa de los planes de EnrollED y lo que incluye cada uno.",
    pages: 1,
    render: () => <PricingPage />,
  },
  {
    id: "lead-gen",
    title: "Lead Generation",
    description: "Pilar 1: generación de prospectos.",
    pages: 1,
    render: () => <LeadGenPage photo={FIXED.leadGenPhoto()} />,
  },
  {
    id: "robust-crm",
    title: "Robust CRM",
    description: "Pilar 2: el CRM de EnrollED.",
    pages: 1,
    render: () => <RobustCrmPage photos={FIXED.robustCrmShots()} />,
  },
  {
    id: "parent-outreach",
    title: "Parent Outreach",
    description: "Pilar 3: contacto con familias.",
    pages: 1,
    render: () => <ParentOutreachPage photo={FIXED.parentOutreachPhoto()} />,
  },
  {
    id: "data-dashboards",
    title: "Data Dashboards",
    description: "Pilar 4: dashboards y datos.",
    pages: 1,
    render: (ctx) => <DataDashboardsPage schoolName={ctx.schoolName} photos={FIXED.dataDashboardsShots()} />,
  },
  {
    id: "marketing-design",
    title: "Full Marketing Design",
    description: "Pilar 5: diseño de materiales de marketing.",
    pages: 1,
    render: (ctx) => <MarketingDesignPage schoolName={ctx.schoolName} photo={FIXED.marketingDesignPhoto()} />,
  },
  {
    id: "cmo-strategy",
    title: "CMO-Level Strategy",
    description: "Pilar 6: estrategia de marketing a nivel CMO.",
    pages: 1,
    render: (ctx) => <CmoStrategyPage schoolName={ctx.schoolName} photo={FIXED.cmoStrategyPhoto()} />,
  },
  {
    id: "cost-comparison",
    title: "Comparación de costos",
    description: "TrustED contra contratar el equipo por separado.",
    pages: 1,
    render: () => <CostComparisonPage logoDark={FIXED.logoDark()} />,
  },
  {
    id: "testimonials",
    title: "Testimonios",
    description: "Cita y tarjetas de escuelas cliente (Phalen, Aspire, AFIA).",
    pages: 1,
    render: () => {
      const logos = FIXED.testimonialLogos();
      return <TestimonialsPage phalenLogo={logos.phalen} aspireLogo={logos.aspire} afiaLogo={logos.afia} />;
    },
  },
  {
    id: "agreement-cover",
    title: "Portada del contrato",
    description: "Primera página del contrato (Part Two: Service Agreement). \"Antes del contrato\" significa antes de este módulo.",
    pages: 1,
    render: () => <AgreementCoverPage logoWhite={FIXED.logoWhite()} />,
  },
  {
    id: "agreement",
    title: "Contrato",
    description:
      "Texto legal del contrato, después de su portada. Fluye en varias páginas. Nada se inserta entre agreement-cover y agreement. Si la propuesta lleva network-pricing, la tarifa del contrato es la de la opción recomendada (precio por campus, número de campus y total); si no, $2,500 por escuela.",
    pages: null,
    check: (ctx, planModules) => (planModules.includes("network-pricing") ? (networkFeeFrom(ctx).error ?? null) : null),
    render: (ctx) => (
      <AgreementPage schoolName={ctx.schoolName} possessive={ctx.schoolPossessive} fee={networkFeeFrom(ctx).fee} />
    ),
  },
  networkPricing,
  networkIncludes,
];

export const MODULES: Record<string, ProposalModule> = Object.fromEntries(list.map((m) => [m.id, m]));

/** Módulo por id. Los "custom:<slug>" no están en el registro: se crean al
 * pedirlos (puede haber varios por propuesta). */
export function getModule(id: string): ProposalModule | undefined {
  if (MODULES[id]) return MODULES[id];
  if (isCustomId(id)) return customModule(id);
  return undefined;
}
