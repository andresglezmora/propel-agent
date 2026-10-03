// Contenido del Service Agreement (páginas 15-21 del PDF original), como
// datos estructurados en vez de HTML/JSX fijo por página — así
// AgreementPage.tsx lo puede volcar en un solo <Page wrap> y dejar que
// @react-pdf/renderer reparta los saltos de página solo, igual que fluye en
// el PDF original entre sus páginas 15 y 21.
//
// type "p": párrafo simple.
// type "kv": término en negrita seguido de su texto (ej. "Initial Term:").
// type "bullets": lista con viñetas.

export type Block =
  | { type: "p"; text: string }
  | { type: "kv"; label: string; text: string }
  | { type: "bullets"; items: string[] };

export type Section = { number: string; heading: string; blocks: Block[] };

/** Precio de un trato de red (la opción recomendada de network-pricing). Sin
 * él, el contrato usa la tarifa estándar de $2,500 por escuela. */
export type NetworkFee = { pricePerCampus: string; campuses: number; total: string };

export function buildAgreementSections(schoolName: string, possessive: string, fee?: NetworkFee): Section[] {
  return [
    {
      number: "1",
      heading: "Parties & Purpose",
      blocks: [
        {
          type: "p",
          text: `This Agreement outlines the terms under which TrustED will provide enrollment growth, marketing, and family outreach services to ${schoolName} in support of student recruitment, conversion, and retention, whether for a single campus or across multiple campuses.`,
        },
      ],
    },
    {
      number: "2",
      heading: "Term & Renewal",
      blocks: [
        { type: "kv", label: "Initial Term:", text: "Month-to-month." },
        {
          type: "kv",
          label: "Termination (for convenience):",
          text: "Either party may terminate after the Initial Term with 30 days' written notice.",
        },
        {
          type: "kv",
          label: "Termination (for cause):",
          text: "Either party may terminate immediately upon written notice if the other party materially breaches and does not cure within 10 days of notice.",
        },
      ],
    },
    {
      number: "3",
      heading: "Services (Overview) & Included Hours",
      blocks: [
        {
          type: "p",
          text: `TrustED will provide a Full-Service Enrollment engagement for ${schoolName} beginning in the first month, delivering end-to-end support to strengthen recruitment, improve conversion, and increase both enrollment and retention. The partnership will be offered at $2,500 per month per school and includes strategic guidance, marketing asset development, creative and design support, CRM automation and reporting, family outreach, retention-focused communication, and ongoing social/content execution (as outlined in Exhibit A). Work will be prioritized weekly to align with the school's most urgent needs and highest-impact opportunities.`,
        },
        {
          type: "p",
          text: "This full-service engagement will continue monthly throughout the term of the Agreement, ensuring the school receives consistent execution and expert support to generate inquiries, increase tours, convert interest into enrolled students, and keep families engaged long-term.",
        },
      ],
    },
    {
      number: "",
      heading: "Full Service — detailed in Exhibit A",
      blocks: [
        {
          type: "p",
          text: fee
            ? `TrustED will deliver a Full Service Enrollment Bundle across ${fee.campuses} participating campuses at ${fee.pricePerCampus} per campus per month (${fee.total} per month in total), as set out in the pricing of this proposal. Each campus receives a defined monthly time allocation across strategy, creative, CRM, and enrollment support.`
            : "TrustED will deliver a Full Service Enrollment Bundle tailored to $2,500 per month per school. This scope is typically designed to meet the needs of a single-campus engagement, with a defined monthly time allocation across strategy, creative, CRM, and enrollment support.",
        },
        {
          type: "p",
          text: "For organizations operating multiple campuses, this same Full Service tier may be applied across sites to keep costs efficient and centralized. However, the included service hours may not provide sufficient capacity to fully support the day-to-day follow-up and execution needs of every campus simultaneously.",
        },
        {
          type: "p",
          text: "To ensure timely coverage and consistent family engagement across all locations, additional Parent Outreach or service hours may be added per Section 5 and Exhibit B as needed. The parties will prioritize services and hours monthly based on enrollment volume, seasonal demand, and available capacity.",
        },
      ],
    },
    {
      number: "4",
      heading: "Fees & Invoicing",
      blocks: [
        {
          type: "kv",
          label: "Base Service Fee:",
          text: fee
            ? `${fee.pricePerCampus}/month per campus for ${fee.campuses} participating campuses (${fee.total}/month in total). Changes to the number of participating campuses require a written pricing adjustment.`
            : "$2,500/month per school.",
        },
        { type: "kv", label: "Parent Outreach (variable):", text: "Per Section 5." },
        {
          type: "kv",
          label: "Ad Spend:",
          text: `Paid directly by ${schoolName} (recommended $500–$1,000/month district-wide, adjustable by season).`,
        },
        { type: "kv", label: "Print / Production / 3rd-Party Tools:", text: "At cost with prior approval." },
        {
          type: "kv",
          label: "Invoicing & Payment:",
          text: "First payment is due immediately upon signing. Thereafter, invoices will be issued on the first of each month and are payable within Net 30 terms.",
        },
      ],
    },
    {
      number: "5",
      heading: "Parent Outreach Hours (Flexible Add-On for Multi-Campus Support)",
      blocks: [
        {
          type: "p",
          text: "Bilingual phone, text, and email outreach to engage prospective and current families across one or more campuses. The base Full Service plan includes up to 30 hours of parent outreach support per month, which is typically sufficient for a single-school engagement. For multi-campus networks, additional outreach capacity may be required to ensure timely follow-up and consistent family communication across all sites. Hours are elective, scalable, and adjustable month-to-month based on enrollment volume and seasonal needs. Rate: $18/hour.",
        },
        {
          type: "bullets",
          items: [
            "10 hrs/mo – Basic follow-up support: $180/mo",
            "20 hrs/mo – Regular outreach campaigns: $360/mo",
            "40 hrs/mo – Comprehensive family engagement: $720/mo",
            "80 hrs/mo – Full-time dedicated specialist: $1,440/mo",
          ],
        },
      ],
    },
    {
      number: "6",
      heading: "Collaboration & Approvals",
      blocks: [
        {
          type: "p",
          text: `In order for us to execute effectively and reach our shared enrollment goals, close collaboration and timely communication are essential. ${schoolName} will provide access to brand assets, staff points of contact, lead lists, and necessary approvals. TrustED will proactively share weekly priorities and requests and will never make material brand or messaging changes without prior approval.`,
        },
      ],
    },
    {
      number: "7",
      heading: "No Enrollment Guarantees",
      blocks: [
        {
          type: "p",
          text: "While TrustED cannot guarantee specific enrollment numbers or financial outcomes, our team works hand-in-hand with each school to develop and execute a strategic plan designed to achieve enrollment goals. We're fully committed to partnering collaboratively, adapting to real-time data and market trends to maximize results and ensure sustained growth.",
        },
      ],
    },
    {
      number: "8",
      heading: "Data Privacy; FERPA",
      blocks: [
        { type: "kv", label: "Use & Access:", text: "TrustED acts as service provider and will use data solely to perform the Services." },
        {
          type: "kv",
          label: "Compliance:",
          text: "TrustED will maintain reasonable safeguards and comply with applicable student privacy laws (including FERPA) to the extent applicable.",
        },
        { type: "kv", label: "Security Incidents:", text: "Prompt notice of any confirmed breach involving school data; good-faith cooperation." },
      ],
    },
    {
      number: "9",
      heading: "Intellectual Property",
      blocks: [
        { type: "kv", label: "Ownership:", text: `All ${schoolName} data remains ${possessive} property.` },
        { type: "kv", label: `${schoolName}'s IP:`, text: `Pre-existing ${schoolName} materials remain ${possessive}.` },
        {
          type: "kv",
          label: "Deliverables:",
          text: `Upon full payment, TrustED grants ${schoolName} a perpetual, royalty-free license to use all final deliverables created for ${possessive} enrollment purposes.`,
        },
        {
          type: "kv",
          label: "Tools & Know-How:",
          text: "TrustED's underlying platforms, templates, code, methods, and know-how remain TrustED's IP; TrustED grants the school a non-exclusive license to use such tools as necessary to receive the Services during the Term.",
        },
      ],
    },
    {
      number: "10",
      heading: "Publicity",
      blocks: [
        {
          type: "p",
          text: `TrustED may reference ${schoolName} as a client and use non-confidential, high-level results in case studies with ${possessive} prior written consent (email confirmation is sufficient). Use of ${possessive} logo in any marketing materials also requires prior written consent.`,
        },
      ],
    },
    {
      number: "11",
      heading: "Independent Contractor",
      blocks: [
        { type: "p", text: "TrustED is an independent contractor. Nothing herein creates a partnership, joint venture, or employment relationship." },
      ],
    },
    {
      number: "12",
      heading: "Limitation of Liability",
      blocks: [
        {
          type: "p",
          text: `Except for confidentiality or data misuse, each party's aggregate liability under this Agreement will not exceed the fees paid or payable by ${schoolName} to TrustED in the three (3) months preceding the claim. Neither party is liable for indirect, incidental, special, consequential, or punitive damages.`,
        },
      ],
    },
    {
      number: "13",
      heading: "Hosting & Access on Pause/Termination",
      blocks: [
        {
          type: "p",
          text: "If services pause or terminate, TrustED can keep landing pages active to support a smooth transition. Lead exports and page assets will be provided upon request. Continued hosting is available under the following options:",
        },
        {
          type: "bullets",
          items: ["Landing Page + CRM Hosting: $99/month", "Landing Page Hosting Only: $25/month"],
        },
      ],
    },
    {
      number: "14",
      heading: "Governing Law",
      blocks: [
        { type: "p", text: "This Agreement is governed by the laws of the State of Arizona, without regard to conflicts principles. Venue shall lie in state or federal courts located in Arizona." },
      ],
    },
    {
      number: "15",
      heading: "Entire Agreement; Amendments",
      blocks: [
        {
          type: "p",
          text: "This Agreement (including Exhibits) is the entire agreement and supersedes prior proposals or statements regarding these Services. Amendments must be in writing and signed (email approval acceptable for monthly package changes).",
        },
      ],
    },
  ];
}

export const exhibitA = (fee?: NetworkFee) => ({
  ...EXHIBIT_A,
  sub: fee
    ? `Full Service Support — ${fee.pricePerCampus}/mo per campus · ${fee.campuses} campuses`
    : EXHIBIT_A.sub,
});

export const exhibitC = (fee?: NetworkFee) => ({
  ...EXHIBIT_C,
  items: EXHIBIT_C.items.map((it) =>
    fee && it.label === "Base Fee:"
      ? { ...it, text: `${fee.total}/month (in advance): ${fee.campuses} participating campuses at ${fee.pricePerCampus}/month per campus.` }
      : it,
  ),
});

export const EXHIBIT_A = {
  heading: "Exhibit A — Scope of Services",
  sub: "Full Service Support — $2,500/mo per school",
  groups: [
    {
      title: "Strategy & Management",
      items: ["CMO-level guidance; monthly planning; weekly alignment/reporting with leadership."],
    },
    {
      title: "Creative & Assets",
      items: [
        "Brand-aligned flyers, postcards, banners, digital ads, one-pagers, slide decks.",
        "High-converting, bilingual landing pages/microsites tied to CRM.",
        "Brand consistency kit (signatures, letterheads, templates) as needed.",
      ],
    },
    {
      title: "Digital & Social",
      items: [
        "Organic social content calendar + publishing; engagement monitoring.",
        "Paid media strategy, creative production, audience targeting; ongoing optimization. (Ad spend paid by the school.)",
      ],
    },
    {
      title: "CRM, Data & Automation",
      items: [
        "TrustED CRM configuration; import of existing/dormant leads; funnel automations.",
        "Real-time dashboards (CPL, CPA, conversion, retention markers).",
        "Data hygiene, list re-engagement, and application follow-through workflows.",
      ],
    },
    {
      title: "Reputation & Retention",
      items: [
        "Support for reviews on Google, GreatSchools, Niche.",
        "Nurture sequences and retention campaigns to lift re-enrollment.",
      ],
    },
    {
      title: "Reporting",
      items: ["Weekly highlights and metrics; monthly ROI review with recommendations."],
    },
  ],
};

export const EXHIBIT_B = {
  heading: "Exhibit B — Parent Outreach Hourly Packages",
  sub: "Optional add-on for multi-campus support · $18/hour",
  intro:
    "Bilingual phone, text, and email follow-up; appointment setting; nurture and re-engagement. Hours may roll over month-to-month; any additional hours beyond the included allocation are billed at the standard hourly rate with school approval.",
  items: [
    "10 hrs/mo (Basic follow-up) – $180/mo",
    "20 hrs/mo (Regular campaigns) – $360/mo",
    "40 hrs/mo (Comprehensive engagement) – $720/mo",
    "80 hrs/mo (Dedicated specialist) – $1,440/mo",
  ],
};

export const EXHIBIT_C = {
  heading: "Exhibit C — Fees, Ad Spend & Billing",
  items: [
    { label: "Base Fee:", text: "$2,500/month (in advance)." },
    { label: "Outreach Package:", text: "Per Exhibit B (in advance; adjustments billed or credited the following cycle as needed)." },
    { label: "Ad Spend:", text: "Recommended $500–$1,000/month district-wide (seasonally adjusted). Paid directly by the school to platforms." },
    { label: "Other Costs:", text: "Print/production/third-party tools at cost with prior approval." },
    { label: "Invoice Terms:", text: "Initial payment is due upon receipt. All subsequent invoices will be sent on the 1st of the month." },
  ],
};

export const EXHIBIT_D = {
  heading: "Exhibit D — Data Protection Addendum (Summary)",
  items: [
    { label: "Data Controller:", text: "The school. Service Provider: TrustED d/b/a TrustED." },
    { label: "Permitted Purpose:", text: "Perform the Services; no secondary use." },
    {
      label: "Safeguards:",
      text: "Reasonable technical/organizational measures (encryption in transit/at rest where available, least-privilege access controls, audit logs, SSO where applicable).",
    },
    { label: "Incident Response:", text: "Prompt notice of confirmed breach; cooperation on investigation and remediation." },
    {
      label: "Return/Deletion:",
      text: "Upon written request or termination, TrustED will export school data and then delete within standard backup cycles, subject to legal retention requirements.",
    },
  ],
};
