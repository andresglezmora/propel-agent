import { defineAgent } from "eve";

export default defineAgent({
  model: "openai/gpt-5.6-terra",
  build: {
    // @react-pdf/renderer no sobrevive al bundler: sus paquetes usan el campo
    // "imports" de package.json (alias como "#standard-fonts/Helvetica") y,
    // ya empaquetados en un solo chunk, Node ya no resuelve esos alias — en
    // Vercel la función truena con MODULE_NOT_FOUND. Se dejan como
    // dependencias normales de node_modules, trazadas al output (mismo
    // remedio que LandingPilot con netlify-cli).
    externalDependencies: [
      "@react-pdf/renderer",
      "@react-pdf/font",
      "@react-pdf/fns",
      "@react-pdf/image",
      "@react-pdf/layout",
      "@react-pdf/pdfkit",
      "@react-pdf/primitives",
      "@react-pdf/reconciler",
      "@react-pdf/render",
      "@react-pdf/stylesheet",
      "@react-pdf/svg",
      "@react-pdf/textkit",
      "@react-pdf/types",
      // El asterisco pide un trazo COMPLETO del paquete (Nitro `traceDeps`):
      // pdfkit carga sus fuentes estándar con require("#standard-fonts/…"), un
      // alias del campo "imports" que el trazador no sigue, y sin estos
      // archivos la función truena en Vercel con MODULE_NOT_FOUND.
      "pdfkit*",
      "fontkit",
      "yoga-layout",
      "brotli",
      "jay-peg",
      "linebreak",
      "restructure",
      "unicode-properties",
      "unicode-trie",
      "png-js",
      "hyphen",
      // sharp es un addon nativo (libvips): comprime las fotos antes de meterlas
      // al PDF. Carga su binario de plataforma (@img/sharp-*) por ruta, así que
      // va completo, igual que pdfkit.
      "sharp*",
      "@img/sharp-linux-x64",
      "@img/sharp-libvips-linux-x64",
    ],
  },
});
