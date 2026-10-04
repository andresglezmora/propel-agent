// Frases que cambian según la propuesta sea para una RED de escuelas o para
// un SOLO campus. Todas viven aquí para que el equipo las revise y apruebe en
// un solo lugar: las páginas solo piden la frase por su clave.
//
// Reglas de las variantes de campus único: mismo largo aproximado que la de
// red (para no mover el diseño) y ninguna capacidad nueva que el original no
// afirme. Lo que no cambia a propósito: los testimonios (son citas de clientes
// reales) y las cláusulas del contrato que ya están en condicional ("For
// organizations operating multiple campuses...").

export type CampusMode = "single" | "network";

const COPY = {
  // Página 2 · Misión
  "mission.clarity": {
    network: "Real-time, district-wide visibility into enrollment, retention, and marketing performance.",
    single: "Real-time, school-wide visibility into enrollment, retention, and marketing performance.",
  },
  "mission.confidenceEnd": {
    network: "allocate resources effectively, and support schools proactively.",
    single: "allocate resources effectively, and support families and staff proactively.",
  },

  // Página 3 · Partner
  "partner.processes": {
    network:
      "That eliminate cracks in the system: automated workflows, retention campaigns, and cross-campus reporting that ensure no inquiry or student is overlooked.",
    single:
      "That eliminate cracks in the system: automated workflows, retention campaigns, and school-wide reporting that ensure no inquiry or student is overlooked.",
  },
  "partner.dashboards": {
    network: "For benchmarking, network-wide and per school.",
    single: "For benchmarking enrollment and campaign performance over time.",
  },
  "partner.scalability": {
    network: "To expand as the school network continues to grow.",
    single: "To grow with the school as enrollment expands.",
  },
  "partner.unifies": {
    network: "that unifies the district's enrollment, marketing, and support services into one",
    single: "that unifies the school's enrollment, marketing, and support services into one",
  },
  "partner.classroomsEnd": {
    network: " across all campuses",
    single: "",
  },

  // Página 4 · Centralized Enrollment
  "centralized.interventionEnd": {
    network: "when a campus needs intervention.",
    single: "when enrollment needs intervention.",
  },
  "centralized.leaders": {
    network:
      "So every leader — from school principals to district executives — sees exactly where progress is being made and where additional support is required.",
    single:
      "So every leader — from the principal to the board — sees exactly where progress is being made and where additional support is required.",
  },

  // Página 6 · Lead Generation
  "leadgen.landing": {
    network:
      "Custom-built pages for each school or campaign that turn clicks into form submissions, designed to capture the right families at the right moment.",
    single:
      "Custom-built pages for each program or campaign that turn clicks into form submissions, designed to capture the right families at the right moment.",
  },

  // Página 9 · Data Dashboards
  "dashboards.audienceEnd": {
    network: "built for both network leadership and individual school administrators.",
    single: "built for both school leadership and your enrollment team.",
  },
  "dashboards.funnelEnd": {
    network: "enrolled — across every school in the network.",
    single: "enrolled — updated in real time.",
  },
  "dashboards.compareTitle": {
    network: "School-by-School Comparison",
    single: "Campaign-by-Campaign Comparison",
  },
  "dashboards.compareStart": {
    network: "Quickly identify which schools are hitting targets and which need additional support",
    single: "Quickly identify which campaigns are hitting targets and which need additional support",
  },

  // Página 10 · Full Marketing Design
  "marketing.assets": {
    network: "asset your schools need — ensuring your brand is consistent, professional, and compelling",
    single: "asset your school needs — ensuring your brand is consistent, professional, and compelling",
  },

  // Página 11 · CMO-Level Strategy
  "cmo.marketAnalysis": {
    network:
      "We study the neighborhoods, competitors, and demographic trends around each school to build campaigns that speak directly to the families most likely to enroll.",
    single:
      "We study the neighborhoods, competitors, and demographic trends around the school to build campaigns that speak directly to the families most likely to enroll.",
  },
  "cmo.hireEnd": {
    network: "thinking most school networks can't afford to hire full-time.",
    single: "thinking most schools can't afford to hire full-time.",
  },

  // Contrato · Ad Spend (sección 4 y Exhibit C)
  "contract.adSpend": {
    network: "recommended $500–$1,000/month district-wide, adjustable by season",
    single: "recommended $500–$1,000/month, adjustable by season",
  },
  "contract.adSpendExhibit": {
    network: "Recommended $500–$1,000/month district-wide (seasonally adjusted). Paid directly by the school to platforms.",
    single: "Recommended $500–$1,000/month (seasonally adjusted). Paid directly by the school to platforms.",
  },
} as const;

export type CopyKey = keyof typeof COPY;

export function campusCopy(mode: CampusMode, key: CopyKey): string {
  return COPY[key][mode];
}

/** Para listas de datos de una página: si el texto es una clave de este
 * archivo devuelve la frase del modo; si no, el texto tal cual. */
export function copyOrText(mode: CampusMode, text: string): string {
  return text in COPY ? COPY[text as CopyKey][mode] : text;
}

/** Pills de Data Dashboards: en campus único no hay "red" ni "por escuela". */
export function dashboardPills(mode: CampusMode): string[] {
  return mode === "network"
    ? ["Network", "District-Level View", "School", "Per-School Breakdown", "Real-Time", "Live Data Sync"]
    : ["School", "School-Wide View", "Funnel", "Stage Breakdown", "Real-Time", "Live Data Sync"];
}

/** Para revisar: todas las frases, red contra campus único. */
export const ALL_CAMPUS_COPY = COPY;
