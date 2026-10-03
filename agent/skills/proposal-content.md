---
name: proposal-content
description: Cómo llenar los módulos que aceptan datos o texto (network-pricing, network-includes, páginas custom:<slug>) — qué pedir al equipo, cuándo puedes redactar tú y cómo escribir texto de propuesta en inglés que quepa en la página.
---

# Contenido de módulos

Algunos módulos de la propuesta aceptan contenido: datos (precios, número de
campus) o texto. `list_modules` muestra cuáles, qué campos tienen y sus límites
de caracteres. `set_module_content` lo valida y comprueba que la hoja quepa en
su página; si no cabe, devuelve el error y debes acortar.

## Quién pone qué

| Tipo | Quién | Cómo |
|---|---|---|
| Cifras: precio por campus, número de campus, cuántas opciones, cuál se recomienda | Siempre el equipo | Pídelas antes de renderizar. Nunca las inventes ni las deduzcas de otra propuesta. |
| Texto que el equipo escribió | El equipo | Tal cual, `source: "team"`. No lo "mejores". Si no cabe, di cuánto sobra y pide que lo recorten o propón un recorte y espera el sí. |
| Texto que nadie dio | Default del módulo | Si el módulo tiene texto por defecto, déjalo. No hace falta llenarlo. |
| Texto que piden que redactes, o que hace falta y no existe | Tú | `source: "ai"`. Al mandar la vista previa di que ese texto lo propusiste tú. |

## Hojas de red (como las de Noble Schools)

Receta `full-service-network`, o `update_plan` para insertar `network-pricing` y
`network-includes` donde diga la instrucción. Mínimo para `network-pricing`:

```json
{ "tiers": [
  { "campuses": 5,  "pricePerCampus": 2250 },
  { "campuses": 10, "pricePerCampus": 2000 },
  { "campuses": 17, "pricePerCampus": 1500, "recommended": true }
] }
```

Los totales ($11,250, $20,000, $25,500) los calcula la plantilla. El número de
campus de los términos sale de aquí.

## Páginas a la medida

Para contenido de un trato que no cabe en ningún módulo: `update_plan` con
`insert` de `custom:<slug>` donde lo pidan, y `set_module_content` con un
`title`, opcional `titleAccent` (la palabra en coral) e `intro`, y de 1 a 8
`blocks`: `section`, `paragraphs`, `numbered`, `cards`, `panel`, `callout`,
`terms`, `prices`. Cada bloque lleva su tipo en el campo `type`:

```json
{ "title": "Your first", "titleAccent": "90 days",
  "blocks": [
    { "type": "section", "label": "How we launch" },
    { "type": "numbered", "items": ["Audit each campus's inquiry flow.", "Train school staff on follow-up."] },
    { "type": "callout", "text": "By day 90 every campus has live campaigns." }
  ] }
```

Usa pocos bloques: una página clara con 3 o 4 bloques se lee
mejor que una llena. Si el contenido da para dos páginas, haz dos módulos
custom.

## Cómo escribir texto de propuesta (en inglés)

- Lector: directores y líderes de red de escuelas. Frases cortas y concretas.
- Cada frase dice qué hace TrustED o qué gana la escuela. Nada de adjetivos de
  relleno: no "seamless", "robust", "cutting-edge", "empower", "unlock",
  "elevate", "revolutionize", "journey".
- Sin "It's not X, it's Y". Di Y directamente.
- Sin cifras que el equipo no dio. "More family inquiries", no "40% more".
- Usa el nombre corto de la escuela ("Noble", no "Noble Schools") en el texto
  corrido; el nombre completo ya va en el encabezado.
- Listas numeradas: cada punto empieza con verbo ("Build…", "Track…") y cabe en
  2 líneas (95 caracteres).
- Título: 2 a 5 palabras, y una sola palabra clave en `titleAccent`.
