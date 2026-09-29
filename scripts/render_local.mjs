#!/usr/bin/env node
/**
 * Fase 0 — renderiza template/full-service/index.preview.html a PDF usando
 * el Chrome ya instalado en esta Mac (puppeteer-core, sin descargar un
 * Chromium aparte). En Vercel (producción) esto se reemplaza por
 * @sparticuz/chromium + puppeteer-core corriendo dentro de la función,
 * misma librería de render, solo cambia de dónde sale el binario — ver
 * PRD sección 5.
 *
 * Uso:
 *   node scripts/render_local.mjs [--file=index.preview.html] [--out=preview.pdf]
 */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TEMPLATE_DIR = path.join(ROOT, "template/full-service");

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
];

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("No se encontró Chrome/Chromium instalado en las rutas conocidas.");
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const inputFile = args.file || "index.preview.html";
const outFile = args.out || "preview.pdf";
const outPath = path.join(TEMPLATE_DIR, outFile);
// Servido por HTTP (no file://): así se parece a producción y evita que
// Chrome bloquee o retrase la carga de Google Fonts sobre file://, que fue
// justo lo que pasó en el primer intento (todo el texto cayó a serif de
// respaldo porque la hoja de estilos remota nunca terminó de aplicar).
const baseUrl = args.baseUrl || "http://localhost:8791/template/full-service";
const inputUrl = `${baseUrl}/${inputFile}`;

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
});
try {
  const page = await browser.newPage();
  await page.emulateMediaType("print");
  await page.goto(inputUrl, { waitUntil: "networkidle0" });
  // Espera activa a que Google Fonts termine de cargar (document.fonts.ready
  // no siempre basta para @import remoto en file://): sin esto, la primera
  // página a veces renderiza con la fuente de respaldo del sistema.
  await page.evaluateHandle("document.fonts.ready");
  await new Promise((r) => setTimeout(r, 300));

  await page.pdf({
    path: outPath,
    printBackground: true,
    preferCSSPageSize: true,
  });
  console.log(`Escrito ${outPath}`);
} finally {
  await browser.close();
}
