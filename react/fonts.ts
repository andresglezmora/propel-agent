import { Font } from "@react-pdf/renderer";
import { assetPath } from "./assets";

// Instancias ESTÁTICAS por peso (ver scripts/instance-fonts, corrido una vez
// en la fase 0): Manrope e Inter de Google Fonts son variable fonts, y
// fontkit (el motor de @react-pdf/renderer) no resuelve el eje "wght" de una
// variable font — solo faces con un peso fijo. Sin esto, todo el texto sale
// en un solo peso sin importar qué fontWeight se pida.
//
// Registro perezoso (registerFonts) y no al importar: en Vercel las fuentes
// se bajan a /tmp la primera vez (ver assets.ts) y registrarlas antes de que
// existan en disco fallaría en el render.
let registered = false;

export function registerFonts() {
  if (registered) return;
  registered = true;

  const F = (name: string) => assetPath(`assets/fonts/${name}`);

  Font.register({
    family: "Manrope",
    fonts: [
      { src: F("Manrope-Regular.ttf"), fontWeight: 400 },
      { src: F("Manrope-Medium.ttf"), fontWeight: 500 },
      { src: F("Manrope-SemiBold.ttf"), fontWeight: 600 },
      { src: F("Manrope-Bold.ttf"), fontWeight: 700 },
      { src: F("Manrope-ExtraBold.ttf"), fontWeight: 800 },
    ],
  });

  Font.register({
    family: "Inter",
    fonts: [
      { src: F("Inter-Regular.ttf"), fontWeight: 400 },
      { src: F("Inter-Medium.ttf"), fontWeight: 500 },
      { src: F("Inter-SemiBold.ttf"), fontWeight: 600 },
      { src: F("Inter-Bold.ttf"), fontWeight: 700 },
    ],
  });

  // react-pdf parte palabras largas con guion automático por default. En
  // textos cortos como títulos y badges se ve mal ("Enroll-ment"). Se
  // desactiva una vez para todo el documento.
  Font.registerHyphenationCallback((word) => [word]);
}
