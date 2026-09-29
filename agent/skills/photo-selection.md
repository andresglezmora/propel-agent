---
name: photo-selection
description: Criterios para elegir la foto de cada uno de los 3 espacios de una propuesta (cover, mission, centralized) — cuándo usar una del sitio, cuándo generar con IA, y las reglas de esa generación.
---

# Selección de fotos para la propuesta

Cada propuesta tiene 3 espacios de foto: `cover`, `mission`, `centralized`. Todo lo demás
en el PDF es fijo (logos, capturas de producto, fotos de TrustED) — nunca se te pide elegir
esas.

## Orden de búsqueda, por espacio

1. **Sitio de la escuela** (`harvest_site_photos`). Siempre primero.
2. **Generada con IA** (`generate_ai_photo`), solo si el sitio no tiene nada útil para ese
   espacio.

No se usa stock. Si el equipo insiste en una foto propia que no está en el sitio, pídesela
directamente y úsala con `set_slot_photo`.

## La portada (`cover`) es la foto más importante

Es la más visible de todo el documento. Al elegir entre varias candidatas del sitio:

- Prioriza alumnos en actividad real, buena luz, sin texto ni logos superpuestos, horizontal.
- Mínimo 1200px de lado largo. Si la mejor candidata no llega a eso, **genera con IA en vez
  de usar una foto pequeña estirada** — se ve pixelada y es peor que una imagen generada.
- `mission` y `centralized` piden un mínimo más bajo: 800px.

## Reglas de la imagen generada con IA

- Puede haber personas, pero **nadie reconocible en primer plano**: grupos, de espaldas,
  fuera de foco o a media distancia. Nunca un retrato posado que se lea como "este es un
  alumno real de esta escuela".
- Sin texto, letreros ni logos generados.
- Estilo fotográfico realista — no se fuerzan los colores de marca de la escuela dentro de
  la imagen.
- Tope de 6 generaciones por propuesta, contando regeneraciones pedidas por el equipo. Al
  llegar al tope, `generate_ai_photo` devuelve un error a propósito: en ese punto pide una
  foto subida por el equipo en su lugar, no insistas generando más.

## Cuando el equipo pide un cambio después de ver la vista previa

Un mensaje como "en la portada usa una del gimnasio" o "genera otra para mission" significa:
`set_slot_photo` o `generate_ai_photo` para ESE espacio nada más, y luego `render_proposal`
otra vez. Nunca regeneres los 3 espacios cuando solo piden cambiar uno.
