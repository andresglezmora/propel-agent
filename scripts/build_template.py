#!/usr/bin/env python3
"""
Fase 0 — arma template/full-service/index.html + styles.css a partir de
template/full-service/manifest.json (salida de extract_template.py).

Estrategia: réplica por posición absoluta. Cada página es un contenedor de
816x1056px (carta a 96dpi) con tres capas, en este orden (de atrás
hacia adelante):
  1. shapes  -> <svg class="shapes"> con un <polygon> por forma de color sólido
               (reconstruye cortes diagonales como el de la portada; ver
               extract_template.py, que ya guarda el polígono real, no solo
               su bbox)
  2. images  -> <img> posicionados con el asset nativo, o {{photo.slot}} en
               los 3 espacios de foto (portada, misión, testimonios)
  3. texts   -> <div class="t"> posicionados, con las variables de nombre de
               escuela ya sustituidas

No genera CSS por Canva 1:1 (tracking, kerning, alto de línea): usa las
métricas medidas de la fuente original a partir del propio manifiesto y deja
el resto como primer acercamiento a refinar con la comparación visual.

Uso:
  python3 scripts/build_template.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_DIR = os.path.join(ROOT, "template/full-service")
MANIFEST_PATH = os.path.join(TEMPLATE_DIR, "manifest.json")
SLOTS_PATH = os.path.join(TEMPLATE_DIR, "slots.json")

PAGE_W, PAGE_H = 816, 1056  # 8.5x11in @ 96dpi, igual que 612x792pt * 4/3

# ---------------------------------------------------------------------------
# Correcciones puntuales de texto (PRD sección 2, "Errores de la plantilla
# actual"). Se aplican ANTES de la sustitución genérica de nombre, sobre el
# texto EXACTO de PROUD Academy, para no tocar nada más.
# ---------------------------------------------------------------------------
ONE_OFF_FIXES = {
    "Sept  25h, 2026": "{{date}}",
    # Estas dos ya emiten el token final directamente (no "PROUD Academy"
    # literal): el reemplazo de un one-off NO se vuelve a escanear contra
    # NAME_PATTERNS, así que si dejara aquí el nombre literal se quedaría
    # sin convertir a variable.
    "By integrating people, processes, and platforms, PROUD Academy gain:": (
        "By integrating people, processes, and platforms, {{school.name}} gains:"
    ),
    "Every PROUD Academy gets a dedicated enrollment strategy—built around your market, your goals, and": (
        "{{school.name}} gets a dedicated enrollment strategy—built around your market, your goals, and"
    ),
    "PROUD AcademyIP: ": "{{school.possessive}} IP: ",
    "$2,500K/mo": "$2,500/mo",
    "Fundrasisng": "Fundraising",
    "Outreach Package (Only for Multi-school netwroks): ": "Outreach Package (Only for Multi-school networks): ",
    "Invoice Terms: Invoice Terms: Initial payment is due upon receipt. All": (
        "Invoice Terms: Initial payment is due upon receipt. All"
    ),
}

# Patrones de nombre, MÁS LARGOS PRIMERO para no partir "PROUD Academy's" en
# "PROUD Academy" + "'s" suelto. Cubre también el typo de apóstrofe recto y
# el de comilla tipográfica sin "s" (page 3: "PROUD Academy' central team").
NAME_PATTERNS = [
    (re.compile(r"PROUD Academy(?:’s|'s)"), "{{school.possessive}}"),
    (re.compile(r"PROUD Academy’"), "{{school.possessive}}"),
    (re.compile(r"PROUD Academy"), "{{school.name}}"),
    (re.compile(r"\bPROUD\b"), "{{school.short}}"),
]

# Frases de alcance red/campus (PRD sección 5 y 14: se aprueban en la fase 0,
# no se activan solas). Se marcan con data-campus para que build_template.py
# pueda, en una pasada futura ya aprobada, emitir la variante "single". Por
# ahora solo se ETIQUETAN para revisión; el HTML generado usa siempre la
# redacción original (network), como la escuela de referencia (PROUD).
CAMPUS_MARKERS = [
    "Network-wide",
    "district-wide",
    "across all campuses",
    "across every",
    "network leadership",
]


# Un solo pase, con las correcciones puntuales (texto exacto) primero y los
# patrones de nombre después, igual que antes — pero ahora operando sobre el
# BLOQUE completo ya aplanado a texto plano (ver restyle_block), no span por
# span, porque "PROUD Academy" puede quedar partido entre dos spans/líneas
# originales (ver nota grande sobre bloques en extract_template.py).
_SUBSTITUTIONS = [(re.compile(re.escape(k)), v) for k, v in ONE_OFF_FIXES.items()] + NAME_PATTERNS


def restyle_block(spans: list) -> list:
    """Aplana los spans de un bloque a (char, style) y vuelve a agrupar
    después de aplicar las correcciones/sustituciones sobre el texto plano
    completo, así una coincidencia puede cruzar dos spans o dos líneas
    originales sin partirse a la mitad. style=None es el separador de línea
    (line-break -> espacio); hereda el estilo del char vecino más cercano."""
    chars = []
    for sp in spans:
        if sp.get("sep"):
            chars.append((" ", None))
        else:
            style = (sp["family"], sp["weight"], sp["italic"], sp["size"], sp["color"])
            chars.extend((ch, style) for ch in sp["text"])

    full_text = "".join(c for c, _ in chars)
    styles = [s for _, s in chars]
    last = None
    for i, s in enumerate(styles):
        if s is None:
            styles[i] = last
        else:
            last = s
    nxt = None
    for i in range(len(styles) - 1, -1, -1):
        if styles[i] is None:
            styles[i] = nxt
        else:
            nxt = styles[i]

    out_chars, out_styles = [], []
    i, n = 0, len(full_text)
    while i < n:
        for pat, repl in _SUBSTITUTIONS:
            m = pat.match(full_text, i)
            if m:
                style = styles[i]
                out_chars.extend(repl)
                out_styles.extend([style] * len(repl))
                i = m.end()
                break
        else:
            out_chars.append(full_text[i])
            out_styles.append(styles[i])
            i += 1

    # Reagrupa corridas consecutivas del mismo estilo en un solo span, para
    # no emitir un <span> por carácter.
    regrouped = []
    for ch, style in zip(out_chars, out_styles):
        if regrouped and regrouped[-1][0] == style:
            regrouped[-1] = (style, regrouped[-1][1] + ch)
        else:
            regrouped.append((style, ch))
    result = []
    for style, text in regrouped:
        if style is None:
            style = ("Manrope", 400, False, 13, "#000000")
        family, weight, italic, size, color = style
        result.append(
            {"text": text, "family": family, "weight": weight, "italic": italic, "size": size, "color": color}
        )
    return result


def esc(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def letter_spacing_for(weight: int) -> str:
    # Medido contra Manrope.ttf real (ver notas de la fase 0): el cuerpo
    # regular corre ligeramente apretado, los títulos bold/extrabold llevan
    # tracking positivo. Aproximación por peso, no por span individual.
    if weight >= 700:
        return "0.02em"
    if weight == 600:
        return "0.01em"
    return "-0.01em"


def build_page(page: dict, slots: dict) -> str:
    pno = page["page"]
    parts = [f'<section class="page" id="page-{pno}" data-page="{pno}">']

    # capa 1: formas (SVG con el path real -curvas incluidas-, no un polígono
    # aproximado: ver build_path_d en extract_template.py)
    if page["shapes"]:
        parts.append(
            f'<svg class="shapes" viewBox="0 0 {PAGE_W} {PAGE_H}" '
            f'width="{PAGE_W}" height="{PAGE_H}" preserveAspectRatio="none">'
        )
        for shp in page["shapes"]:
            op = shp.get("opacity", 1.0)
            op_attr = f' fill-opacity="{op:.3f}"' if op < 1.0 else ""
            rule_attr = ' fill-rule="evenodd"' if shp.get("evenOdd") else ""
            if shp.get("path"):
                parts.append(f'<path d="{shp["path"]}" fill="{shp["color"]}"{op_attr}{rule_attr} />')
            else:
                parts.append(
                    f'<rect x="{shp["x"]:.2f}" y="{shp["y"]:.2f}" '
                    f'width="{shp["w"]:.2f}" height="{shp["h"]:.2f}" fill="{shp["color"]}"{op_attr} />'
                )
        parts.append("</svg>")

    # capa 2: imágenes (fotos fijas + los 3 espacios de foto reemplazables)
    slot_by_file = {v["sourceFile"]: k for k, v in slots.items()}
    for im in page["images"]:
        slot_name = slot_by_file.get(im["file"])
        if slot_name:
            src = "{{photo." + slot_name + "}}"
            # Las 3 fotos reemplazables llevan un desvanecido hacia blanco en
            # el original (para que el texto de al lado no choque con la
            # foto, o para que la franja se integre con el fondo). No viene
            # de una forma vectorial ni de un canal alfa en el PNG — se
            # comprobó que ninguno de los dos existe — así que se replica
            # con un mask-image en CSS por slot en vez de intentar
            # extraerlo del PDF. Ver PRD sección 6 ("Reglas de la imagen IA")
            # y la nota de la fase 0 sobre este hallazgo.
            fade_class = {"mission": " fade-left", "testimonials": " fade-top"}.get(slot_name, "")
            extra_attr = f' data-slot="{slot_name}"'
        else:
            src = f'assets/{im["file"]}'
            fade_class = ""
            extra_attr = ""
        style = f'left:{im["x"]:.2f}px;top:{im["y"]:.2f}px;width:{im["w"]:.2f}px;height:{im["h"]:.2f}px;'
        parts.append(f'<img class="ph{fade_class}" style="{style}" src="{src}"{extra_attr} alt="" />')

    # capa 3: texto, agrupado por bloque/párrafo (ver nota grande en
    # extract_template.py). Un bloque de una sola línea corta (nowrap) se
    # fija sin permitir salto; un párrafo de varias líneas fluye (el
    # navegador decide dónde corta, nunca en el punto exacto de Canva, que
    # es válido solo para el nombre de esta escuela).
    for blk in page["lines"]:
        if blk["nowrap"]:
            box = (
                f'left:{blk["x"]:.2f}px;top:{blk["y"]:.2f}px;'
                f'width:{blk["w"] + 6:.2f}px;height:{blk["h"]:.2f}px;'
                f'line-height:{blk["h"]:.2f}px;white-space:pre;'
            )
        else:
            box = (
                f'left:{blk["x"]:.2f}px;top:{blk["y"]:.2f}px;'
                # +6% de holgura (mínimo 18px): Manrope/Inter de Google Fonts
                # no mide exactamente igual que el subconjunto que Canva
                # incrustó en el PDF, y un párrafo justo en el límite del
                # ancho original puede saltar una línea de más y chocar con
                # el bloque de abajo (ver nota de la fase 0). No evita el
                # riesgo con nombres de escuela MUCHO más largos, pero sí el
                # falso positivo con nombres del mismo orden que "PROUD Academy".
                f'width:{blk["w"] + max(18, blk["w"] * 0.06):.2f}px;height:auto;'
                f'line-height:{blk["lineHeight"]:.2f}px;white-space:normal;'
            )
        spans_html = []
        for sp in restyle_block(blk["spans"]):
            text = esc(sp["text"])
            sp_style = (
                # comillas SIMPLES adentro: el style="..." de afuera ya usa
                # comillas dobles — con dobles adentro también, el atributo
                # se corta en la primera y el resto del CSS se pierde (así
                # cayó todo el documento a Times de respaldo la primera vez)
                f"font-family:'{sp['family']}',sans-serif;font-weight:{sp['weight']};"
                f'font-size:{sp["size"]:.2f}px;color:{sp["color"]};'
                f'letter-spacing:{letter_spacing_for(sp["weight"])};'
            )
            if sp["italic"]:
                sp_style += "font-style:italic;"
            spans_html.append(f'<span style="{sp_style}">{text}</span>')
        parts.append(f'<div class="t" style="{box}">{"".join(spans_html)}</div>')

    parts.append("</section>")
    return "\n".join(parts)


def main():
    manifest = json.load(open(MANIFEST_PATH))
    slots = json.load(open(SLOTS_PATH))

    pages_html = "\n".join(build_page(p, slots) for p in manifest["pages"])

    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Full-Service Proposal</title>
<link rel="stylesheet" href="styles.css" />
</head>
<body>
{pages_html}
</body>
</html>
"""

    css = f"""/* Generado por scripts/build_template.py — no editar a mano.
   Cambios de contenido: manifest.json / slots.json / campus-phrases (fase 0.2).
   Cambios de layout base: este archivo. */
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Inter:ital,wght@0,300;0,400;0,500;0,700;1,400&display=swap');

* {{ box-sizing: border-box; }}
html, body {{ margin: 0; padding: 0; background: #ddd; }}

.page {{
  position: relative;
  width: {PAGE_W}px;
  height: {PAGE_H}px;
  background: #fff;
  overflow: hidden;
  margin: 0 auto 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,.2);
}}

.shapes {{ position: absolute; left: 0; top: 0; width: 100%; height: 100%; }}

img.ph {{ position: absolute; object-fit: cover; display: block; }}
/* Desvanecido hacia blanco de las 3 fotos reemplazables (ver build_template.py,
   capa 2): no es un canal alfa del PNG ni una forma del PDF, se agrega aquí. */
img.ph.fade-left {{
  -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 38%);
  mask-image: linear-gradient(to right, transparent 0%, #000 38%);
}}
img.ph.fade-top {{
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 12%);
  mask-image: linear-gradient(to bottom, transparent 0%, #000 12%);
}}

.t {{
  position: absolute;
  white-space: pre;
  margin: 0;
}}

@media print {{
  html, body {{ background: #fff; }}
  .page {{ margin: 0; box-shadow: none; page-break-after: always; }}
}}

@page {{ size: letter; margin: 0; }}
"""

    with open(os.path.join(TEMPLATE_DIR, "index.html"), "w") as f:
        f.write(html)
    with open(os.path.join(TEMPLATE_DIR, "styles.css"), "w") as f:
        f.write(css)

    # index.preview.html: mismo HTML con las variables resueltas a los
    # valores de PROUD Academy (su fecha y sus 3 fotos originales), para
    # comparar 1:1 contra el PDF de Canva. No es lo que usa el agente en
    # producción (eso resuelve {{...}} en tiempo real); es solo para la
    # verificación visual de la fase 0.
    preview = html.replace("{{school.possessive}}", "PROUD Academy’s")
    preview = preview.replace("{{school.short}}", "PROUD")
    preview = preview.replace("{{school.name}}", "PROUD Academy")
    preview = preview.replace("{{date}}", "September 25, 2026")
    for slot_name, slot in slots.items():
        preview = preview.replace("{{photo." + slot_name + "}}", f"assets/{slot['sourceFile']}")
    with open(os.path.join(TEMPLATE_DIR, "index.preview.html"), "w") as f:
        f.write(preview)

    unresolved = set(re.findall(r"\{\{[a-zA-Z.]+\}\}", preview))
    if unresolved:
        print(f"AVISO: quedaron variables sin resolver en el preview: {unresolved}")

    print(f"Escrito {TEMPLATE_DIR}/index.html, index.preview.html y styles.css ({len(manifest['pages'])} páginas)")


if __name__ == "__main__":
    sys.exit(main())
