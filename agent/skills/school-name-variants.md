---
name: school-name-variants
description: Cómo derivar el posesivo y la forma corta del nombre de una escuela para start_proposal, y cuándo preguntar en vez de adivinar.
---

# Variantes del nombre de la escuela

`start_proposal` guarda 3 formas del nombre: `name`, `possessive` (posesivo) y `short`
(forma corta, opcional). El PDF las usa en distintos puntos — un reemplazo simple de texto
no alcanza, por eso existen las 3.

## El posesivo

Regla general: agrega `'s` — "PROUD Academy" → "PROUD Academy's".

Si el nombre ya termina en "s", solo agrega el apóstrofe — "Williams Academies" →
"Williams Academies'", no "Williams Academies's".

## Cuándo preguntar en vez de seguir

- El nombre trae una abreviatura ambigua ("St. Mary's" ya es posesivo de por sí — confirma
  si el nombre completo de la escuela ya incluye ese apóstrofe antes de agregarle otro).
- El nombre es largo (más de ~40 caracteres) y no te dieron una forma corta: pregunta si
  quieren una, en vez de inventar una abreviatura. Si no la dan, usa el nombre completo — el
  título de la portada reduce su tamaño de letra solo si hace falta, no necesitas acortarlo
  tú.
- Cualquier duda real sobre cómo se escribe el nombre (mayúsculas, puntuación, "The" al
  inicio) — pregúntala en un solo mensaje antes de llamar a `start_proposal`, no la resuelvas
  a tu criterio y sigas.
