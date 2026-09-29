// Sistema de diseño de la propuesta Full-Service. Tokens sacados del PDF de
// Canva original (ver PRD sección 5), usados como constantes de JS en vez de
// variables CSS — @react-pdf/renderer no lee custom properties de CSS.

export const color = {
  purple: "#3e2a6a",
  purpleDark: "#3b164b",
  coral: "#f63d21",
  coralLight: "#ff3400",
  violet: "#cc74f7",
  green: "#00be62",
  lavender: "#e4dfeb",
  navy: "#020d1f",
  ink: "#1a1a2e",
  muted: "#5b5b6e",
  white: "#ffffff",
};

export const space = {
  s1: 8,
  s2: 16,
  s3: 24,
  s4: 32,
  s5: 48,
  s6: 64,
};

// pt, no px: @react-pdf/renderer trabaja en puntos (1/72"), igual que
// cualquier PDF. LETTER = 612 x 792 pt exactos, sin conversión de por medio.
export const PAGE = { width: 612, height: 792 };

export const font = {
  display: "Manrope",
  bodyAlt: "Inter", // Service Agreement, fase posterior
};
