#!/usr/bin/env python3
"""
Fase 0 — compara, página por página, el PDF generado contra el original de
Canva: renderiza ambos a imágenes a la misma resolución y calcula un score de
diferencia por página (0 = idénticas). Escribe una imagen lado-a-lado por
página con score alto en evals/fixtures/proud-academy/diff/, para revisar a
simple vista qué falta ajustar.

Uso:
  python3 scripts/compare_pdfs.py [--threshold=0.06]
"""
import argparse
import os

import fitz
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGINAL = os.path.join(ROOT, "evals/fixtures/proud-academy/original.pdf")
GENERATED = os.path.join(ROOT, "template/full-service/preview.pdf")
DIFF_DIR = os.path.join(ROOT, "evals/fixtures/proud-academy/diff")
DPI = 100


def render_pages(path):
    doc = fitz.open(path)
    imgs = []
    for page in doc:
        pix = page.get_pixmap(dpi=DPI)
        arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
        if pix.n == 4:
            arr = arr[:, :, :3]
        imgs.append(arr)
    return imgs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--threshold", type=float, default=0.06)
    args = ap.parse_args()

    os.makedirs(DIFF_DIR, exist_ok=True)
    orig_pages = render_pages(ORIGINAL)
    gen_pages = render_pages(GENERATED)

    if len(orig_pages) != len(gen_pages):
        print(f"AVISO: número de páginas distinto: original={len(orig_pages)} generado={len(gen_pages)}")

    print(f"{'página':>6} | {'score':>7} | estado")
    print("-" * 34)
    flagged = 0
    for i, (op, gp) in enumerate(zip(orig_pages, gen_pages), start=1):
        if op.shape != gp.shape:
            h = min(op.shape[0], gp.shape[0])
            w = min(op.shape[1], gp.shape[1])
            op_r, gp_r = op[:h, :w], gp[:h, :w]
        else:
            op_r, gp_r = op, gp
        diff = np.abs(op_r.astype(np.int16) - gp_r.astype(np.int16))
        score = float(diff.mean() / 255)
        flag = score > args.threshold
        if flag:
            flagged += 1
        print(f"{i:>6} | {score:7.4f} | {'REVISAR' if flag else 'ok'}")
        if flag:
            hh, ww = op_r.shape[0], op_r.shape[1]
            side = Image.new("RGB", (ww * 2 + 10, hh), (255, 0, 0))
            side.paste(Image.fromarray(op_r), (0, 0))
            side.paste(Image.fromarray(gp_r), (ww + 10, 0))
            side.save(os.path.join(DIFF_DIR, f"page_{i:02d}.png"))

    print("-" * 34)
    print(f"{flagged} de {len(orig_pages)} páginas por encima del umbral ({args.threshold}).")
    if flagged:
        print(f"Comparaciones lado a lado en {DIFF_DIR}/")


if __name__ == "__main__":
    main()
