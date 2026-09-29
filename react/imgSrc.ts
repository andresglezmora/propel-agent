// El <Image> de @react-pdf/renderer acepta una ruta local, una URL, o los
// bytes ya en memoria (Buffer / {data, format}) — no solo un string. Las 3
// fotos por-escuela vienen como Buffer real desde Supabase Storage
// (render_proposal.ts no toca el filesystem); los assets fijos del repo
// siguen siendo rutas string, como hasta ahora.
export type ImgSrc = string | Buffer | { data: Buffer; format: "png" | "jpg" };
