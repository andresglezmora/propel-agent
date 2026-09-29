#!/usr/bin/env python3
"""
Fase 0 — extrae la plantilla del PDF de Canva a un manifiesto JSON por página
(texto posicionado, imágenes rasterizadas con su bbox, y rectángulos de color
sólido) más los assets de imagen a resolución nativa.

No genera el HTML final: eso lo hace build_template.py a partir de
template_manifest.json. Separar extracción de armado deja reintentar el
armado sin volver a leer el PDF cada vez.

Uso:
  python3 scripts/extract_template.py
"""
import json
import os
import sys

import fitz  # PyMuPDF

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_PATH = os.path.join(ROOT, "evals/fixtures/proud-academy/original.pdf")
ASSETS_DIR = os.path.join(ROOT, "template/full-service/assets")
MANIFEST_PATH = os.path.join(ROOT, "template/full-service/manifest.json")

# 1 pt PDF = 1/72 in. 1 px CSS = 1/96 in. Factor para que "612pt de ancho"
# se convierta en "816px" y el @page: size letter (8.5x11in) calce exacto.
PT_TO_PX = 96 / 72

FONT_FAMILY = {
    "Manrope": "Manrope",
    "Inter": "Inter",
    "CanvaSans": "Manrope",  # CanvaSans-Regular solo aparece 39 chars, sin licencia clara: se sustituye
}
FONT_WEIGHT = {
    "Light": 300,
    "Regular": 400,
    "Medium": 500,
    "SemiBold": 600,
    "Bold": 700,
    "ExtraBold": 800,
}


def parse_font(fontname: str):
    """'BAAAAA+Manrope-ExtraBold' -> ('Manrope', 800, False)"""
    base = fontname.split("+")[-1]
    italic = "Italic" in base
    parts = base.replace("Italic", "").split("-")
    family_raw = parts[0]
    style = parts[1] if len(parts) > 1 else "Regular"
    family = FONT_FAMILY.get(family_raw, family_raw)
    weight = FONT_WEIGHT.get(style, 400)
    return family, weight, italic


def color_int_to_hex(c: int) -> str:
    return "#%06x" % c


def rect_key(r):
    return (round(r.x0, 1), round(r.y0, 1), round(r.x1, 1), round(r.y1, 1))


def main():
    os.makedirs(ASSETS_DIR, exist_ok=True)
    doc = fitz.open(PDF_PATH)

    pages_out = []
    seen_xrefs = {}

    for pno, page in enumerate(doc):
        page_no = pno + 1
        pw, ph = page.rect.width * PT_TO_PX, page.rect.height * PT_TO_PX

        # xref de la imagen -> xref de su smask (canal alfa aparte). Sin
        # esto, un logo con fondo transparente se guarda con fondo negro:
        # get_image_info no trae el smask, solo get_images(full=True) lo da.
        smask_of = {img[0]: img[1] for img in page.get_images(full=True) if img[1]}

        # ---- texto --------------------------------------------------------
        # Agrupado por BLOQUE (= un textbox de Canva = un párrafo), no por
        # línea ni por span suelto, por dos razones:
        #
        # 1. Encimado entre spans: dentro de una línea con texto normal +
        #    negrita en medio, si cada span lleva su propio left absoluto,
        #    dos spans quedan pegados o encimados en cuanto la fuente web
        #    (Google Fonts) mide distinto a la fuente subconjunto que Canva
        #    incrustó en el PDF. Fluyendo en línea (inline) dentro de un
        #    contenedor por bloque, el navegador los acomoda solo.
        # 2. El nombre de la escuela puede partirse ENTRE dos líneas del
        #    párrafo original (ej. "...remain PROUD" / "Academy's...", ver
        #    página 18): ese punto de corte es específico del ancho de
        #    "PROUD Academy" y no aplica a otra escuela más larga o más
        #    corta. Reflowar el párrafo completo en el navegador (en vez de
        #    fijar cada línea donde Canva la cortó) es lo único que funciona
        #    para cualquier nombre.
        #
        # Bloques de una sola línea corta (títulos, etiquetas) se marcan
        # como "nowrap": se mantiene su ancho exacto, sin dejar que el
        # navegador los parta si no hace falta.
        blocks_out = []
        raw = page.get_text("rawdict")
        for block in raw["blocks"]:
            if block.get("type") != 0:
                continue
            lines = [l for l in block.get("lines", []) if abs(l["dir"][1]) <= 0.01]
            if not lines:
                continue  # texto rotado: no hay en este documento, se ignora
            per_line_spans = []
            per_line_bbox = []
            for line in lines:
                line_spans = []
                for span in line.get("spans", []):
                    txt = "".join(ch["c"] for ch in span.get("chars", []))
                    if not txt:
                        continue
                    family, weight, italic = parse_font(span["font"])
                    line_spans.append(
                        {
                            "text": txt,
                            "size": round(span["size"] * PT_TO_PX, 2),
                            "family": family,
                            "weight": weight,
                            "italic": italic,
                            "color": color_int_to_hex(span["color"]),
                        }
                    )
                per_line_spans.append(line_spans)
                per_line_bbox.append(line["bbox"])

            # La misma capa duplicada de Canva (ver nota grande, más abajo,
            # sobre bloques repetidos) a veces queda DENTRO de un solo
            # bloque de varias líneas, de dos formas:
            #   a) la ÚLTIMA línea repite la cola de lo que ya decían las
            #      líneas anteriores (página 4: línea1 "CENTRALIZED
            #      ENROLLMENT & OPERATIONS SYSTEM", línea2, de más,
            #      "OPERATIONS SYSTEM") — se detecta por sufijo de texto,
            #      solo si son 3+ caracteres (para no atrapar coincidencias
            #      cortas legítimas).
            #   b) dos líneas ocupan literalmente el mismo bbox (página 3:
            #      el número "01" del badge duplicado exactamente encima de
            #      sí mismo) — no depende del largo del texto, un texto real
            #      nunca ocupa el mismo rectángulo dos veces.
            def line_text(ls):
                return "".join(s["text"] for s in ls)

            def same_bbox(a, b, tol=1.0):
                return all(abs(a[i] - b[i]) <= tol for i in range(4))

            while len(per_line_spans) > 1:
                if same_bbox(per_line_bbox[-1], per_line_bbox[-2]):
                    print(
                        f"  (página {page_no}: recortada línea duplicada en el mismo bbox: "
                        f"{line_text(per_line_spans[-1])!r})"
                    )
                    per_line_spans.pop()
                    per_line_bbox.pop()
                    continue
                tail = line_text(per_line_spans[-1]).strip()
                head = "".join(line_text(ls) for ls in per_line_spans[:-1])
                if len(tail) >= 3 and head.rstrip().endswith(tail):
                    print(f"  (página {page_no}: recortada línea repetida al final de un bloque: {tail!r})")
                    per_line_spans.pop()
                else:
                    break

            spans_out = []
            for li, line_spans in enumerate(per_line_spans):
                spans_out.extend(line_spans)
                if li < len(per_line_spans) - 1:
                    # separador entre líneas originales: un espacio para que
                    # el reflow del párrafo lea bien ("remain PROUD" +
                    # "Academy's" -> "remain PROUD Academy's", no
                    # "remain PROUDAcademy's")
                    spans_out.append({"text": " ", "sep": True})
            if not spans_out or not "".join(s["text"] for s in spans_out).strip():
                continue
            bbox = block["bbox"]
            blocks_out.append(
                {
                    "x": round(bbox[0] * PT_TO_PX, 2),
                    "y": round(bbox[1] * PT_TO_PX, 2),
                    "w": round((bbox[2] - bbox[0]) * PT_TO_PX, 2),
                    "h": round((bbox[3] - bbox[1]) * PT_TO_PX, 2),
                    "nowrap": len(per_line_spans) == 1,
                    "lineHeight": round((bbox[3] - bbox[1]) / len(per_line_spans) * PT_TO_PX, 2),
                    "spans": spans_out,
                }
            )
        # Canva deja capas de texto duplicadas en varias páginas: el mismo
        # textbox pegado dos o tres veces casi en el mismo lugar. Se ve de
        # tres formas distintas, todas con el mismo color y sin offset de
        # sombra (o sea: no es un efecto de diseño, es un residuo de
        # edición):
        #   - duplicado exacto: "(Single Site Pricing)" dos veces
        #   - doblado: "0101" (= "01"+"01"), "PROUD AcademyPROUD"
        #     (= "PROUD Academy" + "PROUD", el prefijo de sí mismo)
        #   - parcial encima: " Academy" solo, sentado sobre la segunda
        #     palabra de "PROUD Academy"
        # No hay forma de saber cuál copia es "la buena" solo mirando el
        # largo del texto (el doblado casi siempre es MÁS LARGO que el
        # limpio). Por eso: se agrupan los bloques que se traslapan en
        # posición, y dentro de cada grupo se busca un candidato C tal que
        # todos los demás se expliquen como ruido DE ESE C (idéntico, C +
        # afijo de C, o un pedazo de C) — ese C es el que se conserva.
        def overlaps(a, b, tol=2.0):
            return not (
                a["x"] + a["w"] < b["x"] - tol
                or b["x"] + b["w"] < a["x"] - tol
                or a["y"] + a["h"] < b["y"] - tol
                or b["y"] + b["h"] < a["y"] - tol
            )

        def is_noise_of(t: str, c: str) -> bool:
            if not t or not c:
                return False
            if t == c:
                return True
            if len(t) >= 2 and (c.startswith(t) or c.endswith(t)):
                return True  # t es un pedazo (prefijo/sufijo) de c
            if t.startswith(c):
                rest = t[len(c):]
                if rest and (c.startswith(rest) or c.endswith(rest)):
                    return True  # t = c + afijo-de-c ("0101" = "01"+"01")
            return False

        for blk in blocks_out:
            blk["_plain"] = "".join(s["text"] for s in blk["spans"] if not s.get("sep")).strip()

        n = len(blocks_out)
        parent = list(range(n))

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for i in range(n):
            for j in range(i + 1, n):
                if overlaps(blocks_out[i], blocks_out[j]):
                    pi, pj = find(i), find(j)
                    if pi != pj:
                        parent[pi] = pj

        clusters = {}
        for i in range(n):
            clusters.setdefault(find(i), []).append(i)

        drop_ids = set()
        for idxs in clusters.values():
            if len(idxs) < 2:
                continue
            texts = [blocks_out[k]["_plain"] for k in idxs]
            if not any(texts):
                continue
            # Entre los candidatos que explican a todo el grupo, se prefiere
            # el TEXTO MÁS CORTO: el doblado ("0101", "PROUD AcademyPROUD")
            # también "explica" al limpio por simple contención de prefijo,
            # pero el limpio nunca es más largo que su propio doblado, así
            # que quedarse con el más corto rompe el empate del lado
            # correcto en los dos casos observados.
            canonical = None
            for ci in idxs:
                c = blocks_out[ci]["_plain"]
                if c and all(is_noise_of(blocks_out[k]["_plain"], c) for k in idxs):
                    if canonical is None or len(c) < len(blocks_out[canonical]["_plain"]):
                        canonical = ci
            if canonical is None:
                continue  # el traslape no se explica como duplicado: contenido distinto, no tocar
            for k in idxs:
                if k != canonical:
                    drop_ids.add(k)

        deduped = [b for k, b in enumerate(blocks_out) if k not in drop_ids]
        for k in sorted(drop_ids):
            print(f"  (página {page_no}: descartada capa duplicada {blocks_out[k]['_plain']!r})")
        for blk in deduped:
            del blk["_plain"]
        # el orden de pintado importaba para las formas/imágenes; el texto ya
        # deduplicado se puede reordenar por (y, x) para lectura sin romper nada
        deduped.sort(key=lambda b: (b["y"], b["x"]))
        lines_out = deduped

        # ---- imágenes (ya rasterizadas: fotos, gradientes, iconos, logos) -
        images = []
        for info in page.get_image_info(xrefs=True):
            xref = info["xref"]
            bbox = info["bbox"]
            w_pt, h_pt = bbox[2] - bbox[0], bbox[3] - bbox[1]
            if w_pt <= 0.5 or h_pt <= 0.5:
                continue  # líneas de 1pt de grosor usadas como separador, no imagen real
            if xref <= 0:
                continue  # imagen inline sin xref propio (raro, sin asset reusable detrás)
            if xref not in seen_xrefs:
                try:
                    pix = fitz.Pixmap(doc, xref)
                except ValueError:
                    print(f"  (omitida xref {xref} en página {page_no}: bad xref)")
                    continue
                if pix.n - pix.alpha >= 4:
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                smask_xref = smask_of.get(xref)
                if smask_xref and not pix.alpha:
                    try:
                        mask = fitz.Pixmap(doc, smask_xref)
                        pix = fitz.Pixmap(pix, mask)
                    except (ValueError, RuntimeError):
                        pass  # sin máscara utilizable: se guarda opaco, mejor que tronar
                filename = f"img_{xref}.png"
                pix.save(os.path.join(ASSETS_DIR, filename))
                seen_xrefs[xref] = {
                    "filename": filename,
                    "nativeW": pix.width,
                    "nativeH": pix.height,
                }
            meta = seen_xrefs.get(xref)
            if meta is None:
                continue
            images.append(
                {
                    "xref": xref,
                    "file": meta["filename"],
                    "nativeW": meta["nativeW"],
                    "nativeH": meta["nativeH"],
                    "x": round(bbox[0] * PT_TO_PX, 2),
                    "y": round(bbox[1] * PT_TO_PX, 2),
                    "w": round(w_pt * PT_TO_PX, 2),
                    "h": round(h_pt * PT_TO_PX, 2),
                }
            )

        # ---- formas de color sólido (fondos de tarjeta, franjas, y los
        # cuadrados ROTADOS que Canva usa para los cortes diagonales, ej. la
        # portada) --------------------------------------------------------
        # Ojo: dr["rect"] es la bbox AXIS-ALIGNED del path, no el path en sí.
        # Un cuadrado rotado 45° reporta una bbox cuadrada normal y se perdía
        # la rotación. Aquí se reconstruye el polígono real desde dr["items"]
        # para poder dibujarlo como <polygon> y no como un <div> rectangular.
        def pt(p):
            return f"{p.x * PT_TO_PX:.2f},{p.y * PT_TO_PX:.2f}"

        def build_path_d(items):
            """Arma un 'd' de SVG real (M/L/C/Z) a partir de los items de
            get_drawings(). Antes esto aplanaba cada curva bezier a una
            línea recta entre sus puntos de control, lo que convertía
            cualquier círculo o icono redondeado en un polígono dentado
            (los anillos numerados "01/02/03" y los pictogramas de iconos
            salían rotos). Con C real, una curva se queda curva."""
            d = []
            cur = None

            def close_to(p):
                return cur is not None and abs(p.x - cur.x) < 0.01 and abs(p.y - cur.y) < 0.01

            for item in items:
                op = item[0]
                if op == "re":
                    rr = item[1]
                    d.append(f"M {pt(rr.tl)} L {pt(rr.tr)} L {pt(rr.br)} L {pt(rr.bl)} Z")
                    cur = rr.tl
                elif op == "qu":
                    q = list(item[1])
                    if q:
                        d.append(f"M {pt(q[0])} " + " ".join(f"L {pt(p)}" for p in q[1:]) + " Z")
                        cur = q[0]
                elif op == "l":
                    p1, p2 = item[1], item[2]
                    if not close_to(p1):
                        d.append(f"M {pt(p1)}")
                    d.append(f"L {pt(p2)}")
                    cur = p2
                elif op == "c":
                    p1, c1, c2, p2 = item[1], item[2], item[3], item[4]
                    if not close_to(p1):
                        d.append(f"M {pt(p1)}")
                    d.append(f"C {pt(c1)} {pt(c2)} {pt(p2)}")
                    cur = p2
            return " ".join(d)

        shapes = []
        for dr in page.get_drawings():
            fill = dr.get("fill")
            if not fill:
                continue
            opacity = dr.get("fill_opacity", 1.0)
            if opacity <= 0.0:
                continue  # forma invisible (opacity 0): Canva las deja como guías, no se pintan
            r = dr["rect"]
            if r.width <= 1 or r.height <= 1:
                continue
            path_d = build_path_d(dr.get("items", []))
            if not path_d:
                continue
            color_hex = "#%02x%02x%02x" % tuple(int(c * 255) for c in fill[:3])
            shapes.append(
                {
                    "x": round(r.x0 * PT_TO_PX, 2),
                    "y": round(r.y0 * PT_TO_PX, 2),
                    "w": round(r.width * PT_TO_PX, 2),
                    "h": round(r.height * PT_TO_PX, 2),
                    "color": color_hex,
                    "opacity": round(opacity, 3),
                    "evenOdd": bool(dr.get("even_odd")),
                    "path": path_d,
                }
            )

        pages_out.append(
            {
                "page": page_no,
                "width": round(pw, 2),
                "height": round(ph, 2),
                "shapes": shapes,
                "images": images,
                "lines": lines_out,
            }
        )
        print(f"page {page_no}: {len(lines_out)} lines, {len(images)} images, {len(shapes)} shapes")

    with open(MANIFEST_PATH, "w") as f:
        json.dump({"pages": pages_out, "ptToPx": PT_TO_PX}, f, indent=1)

    print(f"\n{len(seen_xrefs)} assets únicos escritos en {ASSETS_DIR}")
    print(f"Manifiesto: {MANIFEST_PATH}")


if __name__ == "__main__":
    sys.exit(main())
