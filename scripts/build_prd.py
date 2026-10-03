#!/usr/bin/env python3
"""Genera PRD.html con el motor de la skill prd-html (assets/prdkit.py).

Uso: python3 scripts/build_prd.py
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path.home() / ".claude/skills/prd-html/assets"))
from prdkit import Diagram, build_page  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "PRD.html"

# ───────────────────────── diagramas ─────────────────────────

def d_overview():
    d = Diagram("overview", "Diagrama 1. Lo que hace Propel, de punta a punta.", 700)
    d.node("a", 0, 100, 176, "Entrada", "Pedido", "Nombre de la escuela, sitio web y si es un campus o una red.")
    d.node("b", 0, 300, 176, "Agente", "Propel", "Busca fotos en el sitio y arma el PDF de 19 páginas.")
    d.node("c", 0, 500, 176, "Persona", "Revisión", "Ve el PDF, pide cambios o aprueba.")
    d.node("d", 0, 700, 176, "Salida", "Entrega", "Proposal - Escuela.pdf y un link de 30 días.")
    d.edge("a", "right", "b", "left")
    d.edge("b", "right", "c", "left")
    d.edge("c", "right", "d", "left")
    d.edge("c", "bottom", "b", "bottom", "cambios", k=40, seg=1)
    return d.svg()


def d_flow():
    d = Diagram("flow", "Diagrama 2. Los pasos de una propuesta. Cada recuadro de tipo Tool es una función del agente (sección 12).", 700)
    d.node("start", 0, 300, 300, "Tool", "start_proposal", "Crea el registro: nombre, posesivo, sitio y campus o red.")
    d.node("harv", 1, 300, 300, "Tool", "harvest_site_photos", "Firecrawl lee la home y /about y devuelve las fotos de 600 px o más.")
    d.node("dec", 2, 300, 300, "Decisión", "¿El sitio tiene foto útil para cada espacio?")
    d.node("set", 3, 150, 250, "Tool", "set_slot_photo", "Guarda la foto del sitio en el espacio.")
    d.node("gen", 3, 450, 250, "Tool", "generate_ai_photo", "Imagen con gpt-image-2. Máximo 6 por propuesta.")
    d.node("render", 4, 300, 300, "Tool", "render_proposal", "Arma el PDF, lo guarda como versión nueva y el canal lo manda al chat.")
    d.node("chg", 5, 300, 300, "Decisión", "¿Piden cambios?")
    d.node("fix", 5, 650, 240, "Persona", "Pide el cambio", "Por ejemplo: otra foto de portada.")
    d.node("deliver", 6, 300, 300, "Aprobación", "deliver_proposal", "eve pausa hasta que alguien responda approve.", "inv")
    d.node("end", 7, 300, 300, "Salida", "PDF final y link de 30 días")
    d.edge("start", "bottom", "harv", "top")
    d.edge("harv", "bottom", "dec", "top")
    d.edge("dec", "bottom", "set", "top", "sí")
    d.edge("dec", "bottom", "gen", "top", "no")
    d.edge("set", "bottom", "render", "top")
    d.edge("gen", "bottom", "render", "top")
    d.edge("render", "bottom", "chg", "top")
    d.edge("chg", "right", "fix", "left", "sí")
    d.edge("fix", "top", "render", "right", "nueva versión")
    d.edge("chg", "bottom", "deliver", "top", "no")
    d.edge("deliver", "bottom", "end", "top")
    return d.svg()


def d_photos():
    d = Diagram("photos", "Diagrama 3. Cómo se decide la foto de cada espacio (portada, misión y Centralized Enrollment).", 700)
    d.node("cand", 0, 400, 340, "Entrada", "Candidatas del sitio", "harvest_site_photos las ordena de mayor a menor resolución.")
    d.node("min", 1, 400, 380, "Decisión", "¿Alguna cumple el mínimo del espacio?", "Portada: 1200 px de lado largo. Misión y Centralized: 800 px.")
    d.node("use", 2, 170, 270, "Tool", "set_slot_photo", "Usa la foto del sitio. Para la portada se prefiere alumnos en actividad real, horizontal y sin texto encima.")
    d.node("cap", 2, 600, 270, "Decisión", "¿Ya van 6 imágenes con IA en esta propuesta?")
    d.node("gen", 3, 470, 250, "Tool", "generate_ai_photo", "Foto realista, sin nadie reconocible en primer plano, sin texto ni logos.")
    d.node("ask", 3, 705, 170, "Persona", "Foto del equipo", "Se pide y se usa con set_slot_photo.")
    d.edge("cand", "bottom", "min", "top")
    d.edge("min", "bottom", "use", "top", "sí")
    d.edge("min", "bottom", "cap", "top", "no")
    d.edge("cap", "bottom", "gen", "top", "no")
    d.edge("cap", "bottom", "ask", "top", "sí")
    return d.svg()


def d_approval():
    d = Diagram("approval", "Diagrama 4. Qué pasa cuando alguien escribe \"aprobado\".", 700)
    d.node("p1", 0, 400, 330, "Persona", "Escribe \"aprobado\"", "O approve, aprobada, aprobar.")
    d.node("tr", 1, 400, 330, "Canal", "Traduce a approve", "eve solo reconoce la palabra exacta approve. En español no la reconocería.")
    d.node("pend", 2, 400, 330, "Decisión", "¿Hay una aprobación pendiente?")
    d.node("res", 3, 170, 250, "Estado", "Se resuelve", "La tool corre y la propuesta pasa a delivered.")
    d.node("model", 3, 600, 270, "Agente", "El modelo llama a deliver_proposal", "Lo hace en ese mismo turno, sin pedir otra confirmación en texto.")
    d.node("gate", 4, 600, 270, "Aprobación", "eve pausa y pide approve", "El canal ya mandó el PDF para que se vea qué se aprueba.", "inv")
    d.node("p2", 5, 600, 270, "Persona", "Responde approve")
    d.node("exec", 6, 400, 330, "Tool", "deliver_proposal", "Guarda status delivered y approved_version.")
    d.node("out", 7, 400, 380, "Salida", "El canal manda el PDF final y el link", "Archivo Proposal - Escuela.pdf y un mensaje con el link de 30 días.")
    d.edge("p1", "bottom", "tr", "top")
    d.edge("tr", "bottom", "pend", "top")
    d.edge("pend", "bottom", "res", "top", "sí")
    d.edge("pend", "bottom", "model", "top", "no")
    d.edge("model", "bottom", "gate", "top")
    d.edge("gate", "bottom", "p2", "top")
    d.edge("res", "bottom", "exec", "left", k=40)
    d.edge("p2", "bottom", "exec", "right", k=40)
    d.edge("exec", "bottom", "out", "top")
    return d.svg()


def d_url():
    d = Diagram("url", "Diagrama 5. Por qué el canal manda el PDF y el modelo no toca los links.", 700)
    d.node("b1", 0, 200, 320, "Antes", "render_proposal devuelve una URL firmada", "Es un token de unos 450 caracteres.")
    d.node("b2", 1, 200, 320, "Agente", "El modelo la copia en su mensaje", "Un modelo de lenguaje reescribe, no copia byte a byte.")
    d.node("b3", 2, 200, 320, "Error", "El link llega con un carácter cambiado", "Supabase responde Invalid Compact JWS.", "dashed")
    d.node("a1", 0, 600, 320, "Ahora", "render_proposal devuelve storagePath", "Solo la ruta del archivo en Storage.")
    d.node("a2", 1, 600, 320, "Canal", "El canal firma y descarga el PDF", "Lo hace el código, no el modelo.")
    d.node("a3", 2, 600, 320, "Salida", "El PDF llega como archivo con su nombre", "Proposal - Escuela.pdf, no v1.pdf.")
    d.edge("b1", "bottom", "b2", "top")
    d.edge("b2", "bottom", "b3", "top")
    d.edge("a1", "bottom", "a2", "top")
    d.edge("a2", "bottom", "a3", "top")
    return d.svg()


def d_arch():
    d = Diagram("arch", "Diagrama 6. Piezas del sistema y quién habla con quién.", 700)
    d.node("tg", 0, 200, 300, "Canal", "Telegram", "Chat privado con @trustedpropel_bot. Solo chats permitidos.")
    d.node("sc", 0, 600, 300, "Canal", "Scale CRM, canal #proposals", "Hilos. Entra por propel-dispatch y vuelve por propel-webhook.")
    d.node("ag", 1, 400, 480, "Agente", "Propel, un agente eve en Vercel", "Dos canales, 7 tools, 2 skills e instrucciones. Proyecto propel-agent, URL propel-agent.vercel.app.")
    d.node("fc", 2, 105, 190, "Servicio", "Firecrawl", "Lee el sitio de la escuela.")
    d.node("ai", 2, 305, 190, "Servicio", "AI Gateway", "Modelo del agente e imágenes con gpt-image-2.")
    d.node("sb", 2, 505, 190, "Servicio", "Supabase", "Base de datos (schema propel) y Storage.")
    d.node("pd", 2, 705, 190, "Librería", "react-pdf", "Corre dentro de render_proposal.")
    d.edge("tg", "bottom", "ag", "top", "mensajes y PDFs", seg=1)
    d.edge("sc", "bottom", "ag", "top", "mensajes y PDFs", seg=1)
    for x in ("fc", "ai", "sb", "pd"):
        d.edge("ag", "bottom", x, "top")
    return d.svg()


def d_modules():
    d = Diagram("modules", "Diagrama 7. De la receta al PDF.", 700)
    d.node("rec", 0, 330, 340, "Entrada", "Receta full-service", "Lista ordenada de 15 módulos, de la portada al acuerdo.")
    d.node("plan", 1, 330, 340, "Paso", "Plan de esta propuesta", "Copia de la receta. Se puede insertar o quitar un módulo.")
    d.node("ins", 1, 665, 230, "Persona", "La instrucción dice dónde", "Por ejemplo: los precios de red después de Pricing.")
    d.node("val", 2, 330, 340, "Decisión", "¿Módulos conocidos y sin repetir?", "validatePlan")
    d.node("err", 2, 665, 230, "Error", "No se renderiza", "Se devuelve qué está mal.", "dashed")
    d.node("ph", 3, 330, 340, "Paso", "Fotos que pide el plan", "photoSlotsFor junta los espacios que declara cada módulo.")
    d.node("pdf", 4, 330, 340, "Salida", "Cada módulo dibuja sus páginas", "El PDF sale en el orden del plan.")
    d.edge("rec", "bottom", "plan", "top")
    d.edge("ins", "left", "plan", "right")
    d.edge("plan", "bottom", "val", "top")
    d.edge("val", "right", "err", "left", "no")
    d.edge("val", "bottom", "ph", "top", "sí")
    d.edge("ph", "bottom", "pdf", "top")
    return d.svg()


def d_variants():
    d = Diagram("variants", "Diagrama 0. Una propuesta con variantes, de la petición al PDF.", 700)
    d.node("req", 0, 400, 360, "Entrada", "Petición", "Escuela, sitio, modalidad y, si aplica, hojas extra y dónde van.")
    d.node("net", 1, 400, 360, "Decisión", "¿Piden hojas de red o precios por campus?")
    d.node("rn", 2, 215, 270, "Tool", "start_proposal: full-service-network", "Agrega precios por red y qué incluye después de la página 5.")
    d.node("rb", 2, 585, 270, "Tool", "start_proposal: full-service", "Las 19 páginas de siempre.")
    d.node("extra", 3, 400, 360, "Decisión", "¿Hay hojas extra o en otro lugar?")
    d.node("plan", 4, 615, 290, "Tool", "update_plan", "Inserta, mueve o quita módulos. Una página nueva es custom:<slug>.")
    d.node("content", 5, 400, 360, "Tool", "set_module_content", "Cifras del equipo. Texto del equipo, el de por defecto o propuesto por el modelo.")
    d.node("check", 6, 400, 360, "Decisión", "¿Contenido válido y cada hoja cabe en 1 página?")
    d.node("fix", 6, 690, 200, "Error", "Se dice qué corregir", "Campo, límite o cuánto sobra.", "dashed")
    d.node("out", 7, 400, 360, "Salida", "render_proposal", "PDF al chat. Si hay texto propuesto por el modelo, se avisa.")
    d.edge("req", "bottom", "net", "top")
    d.edge("net", "bottom", "rn", "top", "sí")
    d.edge("net", "bottom", "rb", "top", "no")
    d.edge("rn", "bottom", "extra", "top")
    d.edge("rb", "bottom", "extra", "top")
    d.edge("extra", "right", "plan", "top", "sí")
    d.edge("plan", "bottom", "content", "right")
    d.edge("extra", "bottom", "content", "top", "no")
    d.edge("content", "bottom", "check", "top")
    d.edge("check", "right", "fix", "left", "no")
    d.edge("fix", "top", "content", "right", k=30)
    d.edge("check", "bottom", "out", "top", "sí")
    return d.svg()


def d_content():
    d = Diagram("content", "Diagrama 0. Quién escribe cada contenido de un módulo.", 700)
    d.node("num", 0, 400, 300, "Decisión", "¿Es una cifra?", "Precio por campus, número de campus, opciones.")
    d.node("team1", 1, 170, 260, "Persona", "La da el equipo", "Nunca la inventa el modelo. Sin ella no se renderiza.")
    d.node("txt", 1, 590, 280, "Decisión", "¿El equipo dio el texto?")
    d.node("team2", 2, 455, 230, "Tool", "Tal cual, source team", "No se \"mejora\". Si no cabe, se pide recortar.")
    d.node("ask", 2, 700, 180, "Decisión", "¿Piden redactarlo?")
    d.node("def", 3, 535, 170, "Estado", "Texto por defecto", "El de Noble con el nombre de la escuela.")
    d.node("ai", 3, 710, 160, "Agente", "Lo redacta el modelo", "source ai. Se avisa al revisar.")
    d.edge("num", "bottom", "team1", "top", "sí")
    d.edge("num", "bottom", "txt", "top", "no")
    d.edge("txt", "bottom", "team2", "top", "sí")
    d.edge("txt", "bottom", "ask", "top", "no")
    d.edge("ask", "bottom", "def", "top", "no")
    d.edge("ask", "bottom", "ai", "top", "sí")
    return d.svg()


def d_render():
    d = Diagram("render", "Diagrama 8. Lo que hace render_proposal por dentro.", 700)
    d.node("r1", 0, 400, 420, "Paso 1", "Lee la propuesta y baja las 3 fotos", "Las fotos elegidas se descargan de Storage.")
    d.node("r2", 1, 400, 420, "Paso 2", "ensureAssets", "Si faltan fuentes, logos o capturas en /tmp, las baja de Storage (carpeta _assets).")
    d.node("r3", 2, 400, 420, "Paso 3", "registerFonts y renderToBuffer", "react-pdf arma las 19 páginas en memoria.")
    d.node("sz", 3, 400, 420, "Decisión", "¿El PDF pesa más de 8 MB?")
    d.node("bad", 4, 170, 250, "Estado", "failed", "Se guarda el error y se avisa en el chat.", "dashed")
    d.node("ok", 4, 600, 290, "Tool", "Sube {id}/v{n}.pdf", "Registra la versión y deja la propuesta en awaiting_approval.")
    d.node("ret", 5, 600, 290, "Salida", "Devuelve storagePath", "El canal manda el archivo al chat.")
    d.edge("r1", "bottom", "r2", "top")
    d.edge("r2", "bottom", "r3", "top")
    d.edge("r3", "bottom", "sz", "top")
    d.edge("sz", "bottom", "bad", "top", "sí")
    d.edge("sz", "bottom", "ok", "top", "no")
    d.edge("ok", "bottom", "ret", "top")
    return d.svg()


def d_states():
    d = Diagram("states", "Diagrama 9. Estados de una propuesta (columna status de proposals).", 600)
    d.node("s1", 0, 300, 260, "Estado", "draft", "La crea start_proposal.")
    d.node("s2", 1, 300, 260, "Estado", "harvesting", "harvest_site_photos busca fotos.")
    d.node("s3", 2, 300, 260, "Estado", "rendering", "render_proposal arma el PDF.")
    d.node("f", 2, 640, 240, "Estado", "failed", "El render falló o pasó de 8 MB.", "dashed")
    d.node("s4", 3, 300, 260, "Estado", "awaiting_approval", "El PDF ya está en el chat.")
    d.node("s5", 4, 300, 260, "Estado", "delivered", "deliver_proposal con la versión aprobada.")
    d.edge("s1", "bottom", "s2", "top")
    d.edge("s2", "bottom", "s3", "top")
    d.edge("s3", "right", "f", "left", "error")
    d.edge("s3", "bottom", "s4", "top")
    d.edge("s4", "left", "s3", "left", "cambios: otra versión", k=80, seg=1)
    d.edge("s4", "bottom", "s5", "top", "aprobada")
    return d.svg()


def d_telegram():
    d = Diagram("telegram", "Diagrama 10. Telegram: quién puede hablar y cómo llegan los archivos.", 700)
    d.node("m", 0, 400, 320, "Entrada", "Mensaje en el chat del bot", "Telegram llama al webhook /eve/v1/telegram.")
    d.node("al", 1, 400, 380, "Decisión", "¿El chat.id está en TELEGRAM_ALLOWED_CHAT_IDS?", "Si la variable está vacía, nadie entra.")
    d.node("no", 2, 150, 220, "Estado", "Se ignora", "El bot no responde.", "dashed")
    d.node("yes", 2, 560, 300, "Agente", "El agente atiende la conversación", "Busca fotos, genera y renderiza.")
    d.node("pv", 3, 560, 330, "Salida", "Preview", "Se sube el PDF con el nombre Proposal - Escuela (preview v1).pdf.")
    d.node("fin", 4, 560, 330, "Salida", "Entrega final", "PDF Proposal - Escuela.pdf y un mensaje con el link de 30 días.")
    d.edge("m", "bottom", "al", "top")
    d.edge("al", "bottom", "no", "top", "no")
    d.edge("al", "bottom", "yes", "top", "sí")
    d.edge("yes", "bottom", "pv", "top")
    d.edge("pv", "bottom", "fin", "top", "aprobado")
    return d.svg()


def d_scale():
    d = Diagram("scale", "Diagrama 11. Un mensaje en #proposals, de ida y de vuelta.", 700)
    d.node("p", 0, 140, 230, "Persona", "Escribe en #proposals", "Por ejemplo: Hazme la proposal de Aspire, red de campus.")
    d.node("db", 1, 140, 230, "Scale", "Guarda el mensaje", "Lo pone en agent_outbox para entregarlo con reintentos.")
    d.node("disp", 2, 400, 230, "Edge function", "propel-dispatch", "POST a /cowork/message con messageId, threadId, autor y adjuntos.")
    d.node("in", 3, 660, 230, "Propel", "Recibe", "Verifica el secreto, descarta duplicados por messageId y responde 200.")
    d.node("run", 4, 660, 230, "Propel", "La sesión del hilo trabaja", "Corre las tools: fotos, render, aprobación.")
    d.node("back", 5, 660, 230, "Propel", "Responde en el hilo", "POST al webhook con el texto y el PDF como adjunto.")
    d.node("wh", 6, 400, 230, "Edge function", "propel-webhook", "Valida el secreto, baja el PDF a su Storage y guarda el mensaje.")
    d.node("ui", 7, 140, 230, "Scale", "El hilo se actualiza", "Se ve Propel está escribiendo, el resumen y el PDF.")
    d.edge("p", "bottom", "db", "top")
    d.edge("db", "right", "disp", "left")
    d.edge("disp", "right", "in", "left")
    d.edge("in", "bottom", "run", "top")
    d.edge("run", "bottom", "back", "top")
    d.edge("back", "left", "wh", "right")
    d.edge("wh", "left", "ui", "right")
    return d.svg()


# ───────────────────────── contenido ─────────────────────────

SECTIONS = []  # (id, titulo, html)


def section(id, title, body):
    SECTIONS.append((id, title, body))


section("resumen", "Qué es Propel", f"""
<p>Propel es un agente que genera la propuesta comercial <strong>TrustED Full-Service</strong> en PDF. Le dices el nombre de la escuela, su sitio web y si es un campus o una red de campus. Propel busca las fotos, arma el PDF y lo manda al chat para que una persona lo revise y lo apruebe.</p>
<p>La base son las 19 páginas de la plantilla. Además puede armar <strong>variantes</strong>: agregar las hojas de trato para redes (precios por número de campus, qué incluye, reportes de distrito y términos), poner una hoja donde lo pida la instrucción o crear una página a la medida con los bloques del sistema visual.</p>
<p>Está hecho con <strong>eve</strong>, el framework de Vercel para agentes: un agente es una carpeta de archivos (instrucciones, tools, canales, skills) que eve compila y despliega. Vive en Vercel y se usa por Telegram y por un canal de Scale CRM.</p>
{d_overview()}
<p>En la prueba con Aspire Public Schools pasaron unos 40 segundos entre el mensaje y el PDF de preview.</p>
""")

section("problema", "Problema y objetivo", """
<h3>Problema</h3>
<p>La propuesta se armaba a mano en Canva: duplicar la plantilla, cambiar el nombre de la escuela en cada página donde aparece, buscar tres fotos y exportar. Es lento y es fácil dejar un nombre viejo en alguna página.</p>
<h3>Objetivo</h3>
<p>Dar nombre, sitio web y modalidad, y recibir un PDF idéntico a la plantilla, sin tocar el diseño ni el texto.</p>
<h3>Cómo sabemos que funciona</h3>
<ul>
<li>El PDF tiene las páginas de su receta y solo cambia lo que listan las secciones 3 y 6.</li>
<li>Pesa menos de 8 MB. Si pasa, el render se bloquea.</li>
<li>Ninguna propuesta se entrega sin que una persona la apruebe.</li>
<li>Del mensaje al preview pasa menos de un minuto. Medido: 15:03:42 el mensaje, 15:04:21 el PDF.</li>
</ul>
<div class="callout"><span class="label">Regla central</span><p>El texto de los módulos fijos (pilares, testimonios, precios de planes, contrato) nunca se reescribe. Las hojas de trato aceptan texto del equipo, usan uno por defecto o, si se lo piden, el modelo propone uno, que queda marcado para revisión. Las cifras siempre las da el equipo.</p></div>
""")

section("cambia", "Qué cambia en cada propuesta", """
<p>Todo el PDF es fijo menos esto:</p>
<div class="table-wrap"><table>
<thead><tr><th>Campo</th><th>Dónde aparece</th><th>De dónde sale</th></tr></thead>
<tbody>
<tr><td>Nombre de la escuela</td><td>Portada, misión, partner, dashboards, marketing, CMO y acuerdo</td><td>Lo escribe la persona. Propel deriva el posesivo (Aspire's, Jones') y una forma corta opcional.</td></tr>
<tr><td>Fecha</td><td>Portada</td><td>El día en que se genera el PDF.</td></tr>
<tr><td>Foto de portada</td><td>Página 1</td><td>Sitio de la escuela, o IA si el sitio no sirve.</td></tr>
<tr><td>Foto de misión</td><td>Página 2</td><td>Igual.</td></tr>
<tr><td>Foto de Centralized Enrollment</td><td>Página 4</td><td>Igual.</td></tr>
<tr><td>Hojas de trato y páginas a la medida</td><td>Donde las ponga el plan</td><td>Cifras del equipo; texto del equipo, por defecto o propuesto por el modelo (sección 6).</td></tr>
<tr><td>Campus único</td><td>Portada y página 3</td><td>Se quita "Network-wide" de la portada y " across all campuses" de la página 3.</td></tr>
</tbody></table></div>
<div class="callout"><span class="label">Pendiente</span><p>Hoy solo se adaptan esas dos frases para un campus único. El resto del PDF habla de red. La lista completa de frases por cambiar falta definirla y aprobarla (sección 17).</p></div>
""")

section("alcance", "Alcance", """
<div class="grid">
<div class="card"><h3>Dentro de V1</h3><ul>
<li>Telegram, en chat privado</li>
<li>Canal #proposals en Scale CRM, con hilos</li>
<li>Fotos desde el sitio de la escuela (Firecrawl)</li>
<li>Imágenes con IA cuando el sitio no sirve, máximo 6</li>
<li>PDF de la plantilla Full-Service, 19 páginas</li>
<li>Variantes: recetas, hojas en el lugar que pida la instrucción y páginas a la medida</li>
<li>Aprobación humana antes de entregar</li>
<li>Versiones: cada render guarda v1, v2, v3</li>
<li>Link de descarga de 30 días</li>
</ul></div>
<div class="card"><h3>Fuera de V1</h3><ul>
<li>Otras plantillas base que no sean Full-Service (las variantes parten de ella)</li>
<li>Editar el texto de los módulos fijos</li>
<li>Una interfaz en Scale para armar recetas (hoy se guardan desde el chat)</li>
<li>Fotos de stock</li>
<li>Una interfaz web propia: Scale la reemplaza</li>
<li>Enviar la propuesta por correo a la escuela</li>
</ul></div>
</div>
""")

section("flujo", "Flujo de una propuesta", f"""
<p>Estos son los pasos, en orden. Los hace el agente solo, y la persona interviene para dar los datos iniciales, pedir cambios y aprobar.</p>
{d_flow()}
<ol>
<li><strong>Datos.</strong> Si falta el sitio, o no queda claro si es un campus o una red, el agente lo pregunta antes de crear nada.</li>
<li><strong>Fotos.</strong> Primero el sitio de la escuela. La IA solo entra si el sitio no tiene nada útil (sección 7).</li>
<li><strong>Render.</strong> Se genera una versión nueva en cada llamada. Nunca se sobrescribe la anterior.</li>
<li><strong>Cambios.</strong> Si piden otra foto, se corrige solo ese espacio y se vuelve a renderizar.</li>
<li><strong>Entrega.</strong> Solo con aprobación humana (sección 8).</li>
</ol>
""")

section("variantes", "Variantes de propuesta", f"""
<p>Una propuesta es una <strong>receta</strong> (lista ordenada de módulos) que se puede ajustar para cada trato. El plan ajustado y el contenido de cada módulo se guardan en la propuesta, así que una versión nueva parte de lo último que se pidió.</p>
{d_variants()}
<h3>Recetas</h3>
<div class="table-wrap"><table>
<thead><tr><th>Receta</th><th>Qué es</th><th>Necesita</th></tr></thead>
<tbody>
<tr><td><code>full-service</code></td><td>Las 19 páginas de siempre.</td><td>Nombre, sitio, modalidad, 3 fotos.</td></tr>
<tr><td><code>full-service-network</code></td><td>Lo mismo más las dos hojas de red después de la página 5 (21 páginas).</td><td>Además, las opciones de precio del trato.</td></tr>
<tr><td>Guardadas</td><td>Las que el equipo guarda desde el chat con <code>save_recipe</code> (tabla <code>propel.recipes</code>).</td><td>Lo que pidan sus módulos.</td></tr>
</tbody></table></div>
<h3>Hojas de red</h3>
<p>Salen de las hojas que se hicieron a mano para Noble Schools, con el mismo diseño. <code>network-pricing</code> lleva hasta 3 opciones (número de campus y precio por campus) y calcula los totales. <code>network-includes</code> lleva servicios incluidos, reportes de distrito y términos, y toma el número de campus de la hoja de precios. Todo su texto tiene un valor por defecto, que es el de Noble con el nombre de la escuela.</p>
<h3>El contrato toma el precio del trato</h3>
<p>Si la propuesta lleva <code>network-pricing</code>, el contrato usa la opción recomendada (o la única, si hay una sola) en vez de la tarifa estándar de $2,500 por escuela. Cambian 4 puntos y nada más:</p>
<div class="table-wrap"><table>
<thead><tr><th>Dónde</th><th>Texto con el ejemplo de Noble</th></tr></thead>
<tbody>
<tr><td>Sección 3, alcance</td><td>"…across 17 participating campuses at $1,500 per campus per month ($25,500 per month in total), as set out in the pricing of this proposal."</td></tr>
<tr><td>Sección 4, Base Service Fee</td><td>"$1,500/month per campus for 17 participating campuses ($25,500/month in total). Changes to the number of participating campuses require a written pricing adjustment."</td></tr>
<tr><td>Exhibit A</td><td>"Full Service Support, $1,500/mo per campus · 17 campuses"</td></tr>
<tr><td>Exhibit C, Base Fee</td><td>"$25,500/month (in advance): 17 participating campuses at $1,500/month per campus."</td></tr>
</tbody></table></div>
<p>Sin hojas de red el contrato no cambia. Con varias opciones y ninguna recomendada, la propuesta no se renderiza: no habría un precio que firmar.</p>
<h3>Quién escribe qué</h3>
{d_content()}
<h3>Páginas a la medida</h3>
<p>Cuando un trato pide contenido que no cabe en ningún módulo, se inserta <code>custom:&lt;slug&gt;</code> donde lo pida la instrucción y se llena con un título y de 1 a 8 bloques del sistema visual: <code>section</code>, <code>paragraphs</code>, <code>numbered</code>, <code>cards</code>, <code>panel</code>, <code>callout</code>, <code>terms</code> y <code>prices</code>. No se diseña nada nuevo: los bloques son los mismos de las hojas de Noble y cada uno tiene límites de texto.</p>
<h3>Reglas que se validan en código</h3>
<ul>
<li>Cada campo tiene un límite de caracteres. Si no se cumple, la tool dice qué campo y cuál es el límite.</li>
<li>Cada hoja con contenido se renderiza sola antes del PDF final y debe ocupar exactamente 1 página.</li>
<li>Solo una opción de precio puede ser la recomendada.</li>
<li>La palabra en coral del título (<code>titleAccent</code>) no puede repetirse dentro del título.</li>
<li>Nada se inserta entre la portada del contrato y el contrato: "antes del contrato" es antes de <code>agreement-cover</code>.</li>
</ul>
""")

section("fotos", "Fotos", f"""
<p>Cada propuesta tiene tres espacios de foto. Todo lo demás (logos, capturas de producto, fotos de TrustED) viene fijo con la plantilla.</p>
{d_photos()}
<div class="table-wrap"><table>
<thead><tr><th>Espacio</th><th>Página</th><th>Mínimo</th><th>Criterio</th></tr></thead>
<tbody>
<tr><td><code>cover</code></td><td>1</td><td>1200 px de lado largo</td><td>Es la foto más visible del documento. Alumnos en actividad real, buena luz, horizontal, sin texto ni logos encima. Si ninguna llega al mínimo se genera con IA, porque una foto chica estirada se ve peor que una generada.</td></tr>
<tr><td><code>mission</code></td><td>2</td><td>800 px</td><td>Alumnos con docentes, si el sitio lo tiene (suele estar en /about).</td></tr>
<tr><td><code>centralized</code></td><td>4</td><td>800 px</td><td>Cualquier foto de la comunidad escolar.</td></tr>
</tbody></table></div>
<h3>Reglas de las imágenes con IA</h3>
<ul>
<li>Pueden aparecer personas, pero nadie reconocible en primer plano: grupos, de espaldas, fuera de foco o a media distancia.</li>
<li>Sin texto, letreros ni logos.</li>
<li>Máximo 6 generaciones por propuesta, contando las regeneraciones. Al llegar al tope, la tool devuelve un error a propósito y el agente pide una foto al equipo.</li>
<li>No se usan fotos de stock. Una foto de stock con menores presentada como alumnos de la escuela es un riesgo que no se corre.</li>
</ul>
<p>Una misma foto no puede ir en dos espacios: <code>set_slot_photo</code> lo rechaza. La búsqueda descarta gráficos con texto encima cuando el nombre del archivo lo indica (portadas de blog, banners, flyers). Antes de entrar al PDF, cada foto se reduce al tamaño que ocupa (1600 px la portada, 1200 las demás) y se pasa a JPEG.</p>
<p>El filtro de la tool de búsqueda es de 600 px. Los mínimos de 1200 y 800 los aplica el agente siguiendo la skill <code>photo-selection</code>.</p>
""")

section("aprobacion", "Aprobación y entrega", f"""
<p>La entrega pasa por una aprobación de eve (<code>approval: always()</code> en <code>deliver_proposal</code>). Mientras no se responda <code>approve</code>, la tool no corre y la propuesta no se marca como entregada.</p>
{d_approval()}
<div class="callout"><span class="label">Decisión</span><p>Se mantiene la aprobación de eve aunque cueste dos mensajes ("aprobado" y luego approve). Nadie entrega por error. Si el equipo prefiere uno solo, hay que quitar la aprobación para el canal de Scale, y eso se decide aparte.</p></div>
<h3>El modelo no maneja links</h3>
<p>En la primera prueba de Scale el link de descarga salió roto. La causa: <code>render_proposal</code> devolvía la URL firmada al modelo y el modelo la reescribía en su mensaje cambiando un carácter. La solución fue que las tools devuelvan solo la ruta (<code>storagePath</code>) y que cada canal firme el link y suba el archivo.</p>
{d_url()}
""")

section("arquitectura", "Arquitectura", f"""
{d_arch()}
<div class="table-wrap"><table>
<thead><tr><th>Pieza</th><th>Para qué</th><th>Configuración</th></tr></thead>
<tbody>
<tr><td>Vercel</td><td>Corre el agente. Proyecto <code>propel-agent</code>, equipo <code>mora-os</code>.</td><td>Variables de entorno del proyecto</td></tr>
<tr><td>AI Gateway</td><td>Modelo del agente (<code>openai/gpt-5.6-terra</code>) e imágenes (<code>openai/gpt-image-2</code>).</td><td><code>AI_GATEWAY_API_KEY</code></td></tr>
<tr><td>Firecrawl</td><td>Lee la home y /about del sitio y devuelve las URLs de imágenes.</td><td><code>FIRECRAWL_API_KEY</code></td></tr>
<tr><td>Supabase</td><td>Base de datos (schema <code>propel</code>) y Storage (bucket privado <code>propel-proposals</code>).</td><td><code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code></td></tr>
<tr><td>react-pdf</td><td>Genera el PDF en memoria dentro de la función. No hay navegador.</td><td>Sin servicio externo</td></tr>
</tbody></table></div>
<div class="callout"><span class="label">Supabase compartido</span><p>El plan gratis no permite otro proyecto, así que Propel usa el de LandingPilot, aislado en su propio schema. La sección 15 explica cómo se protege.</p></div>
""")

section("pdf", "Cómo se genera el PDF", f"""
<h3>Módulos y recetas</h3>
<p>La plantilla está partida en <strong>módulos</strong>: los 15 de la plantilla base (uno por página, salvo el contrato, que fluye en varias), las 2 hojas de red y las páginas a la medida. Una <strong>receta</strong> es la lista ordenada de módulos que forma una variante. Crear una variante es escribir otra lista, no copiar páginas.</p>
{d_modules()}
<p>Cada módulo declara su id, título, descripción, cuántas páginas ocupa, qué espacios de foto necesita y, si acepta contenido, su esquema con límites y su texto por defecto. <code>render_proposal</code> pide solo las fotos que declaran los módulos del plan.</p>
<h3>Render</h3>
{d_render()}
<h3>Las 19 páginas</h3>
<div class="table-wrap"><table>
<thead><tr><th>Páginas</th><th>Contenido</th><th>Qué cambia</th></tr></thead>
<tbody>
<tr><td>1</td><td>Portada</td><td>Nombre, fecha, foto, "Network-wide"</td></tr>
<tr><td>2</td><td>Misión</td><td>Nombre, foto</td></tr>
<tr><td>3</td><td>Partner</td><td>Nombre, " across all campuses"</td></tr>
<tr><td>4</td><td>Centralized Enrollment</td><td>Nombre, foto</td></tr>
<tr><td>5</td><td>Precios</td><td>Nada</td></tr>
<tr><td>6 a 11</td><td>Los seis pilares: Lead Generation, Robust CRM, Parent Outreach, Data Dashboards, Full Marketing Design, CMO Strategy</td><td>Nombre en dashboards, marketing y CMO</td></tr>
<tr><td>12</td><td>Comparación de costos</td><td>Nada</td></tr>
<tr><td>13</td><td>Testimonios</td><td>Nada</td></tr>
<tr><td>14</td><td>Portada del acuerdo</td><td>Nada</td></tr>
<tr><td>15 a 19</td><td>Acuerdo (texto legal que fluye en varias páginas)</td><td>Nombre y posesivo</td></tr>
</tbody></table></div>
<h3>Reglas de diseño</h3>
<ul>
<li>Tamaño carta, 612 x 792 pt.</li>
<li>Tipografía: Manrope en títulos e Inter en cuerpo. Los títulos llevan letter-spacing de -1.</li>
<li>Iconos Phosphor. Sobre fondo claro, peso <code>fill</code>.</li>
<li>El duotono solo va en la foto de portada.</li>
<li>Las imágenes de Lead Generation y CMO Strategy usan <code>objectFit: "contain"</code> y fondo blanco: no se recortan.</li>
</ul>
<h3>Peso del PDF</h3>
<p>Las capturas y fotos fijas de la plantilla se guardan en JPEG optimizado (<code>template/full-service/optimized/</code>, generadas con <code>scripts/optimize-assets.ts</code>): pasaron de 4.9 MB a 0.8 MB. El PDF base bajó de 7.5 MB a 2.9 MB, y una propuesta de red con página a la medida pesa unos 2.4 MB. El tope sigue en 8 MB.</p>
<h3>Assets fijos</h3>
<p>Fuentes, logos y capturas viven en Storage, carpeta <code>_assets/</code>. En Vercel el bundle no incluye archivos que se referencian por ruta, así que se descargan a <code>/tmp</code> la primera vez que una instancia los necesita. Si agregas un asset a la plantilla, súmalo a <code>FIXED_ASSET_PATHS</code> en <code>react/assets.ts</code> y corre <code>npm run assets:upload</code>. Si no, funciona en local y falla en Vercel.</p>
<div class="callout"><span class="label">Decisión</span><p>La plantilla se hizo en React con <code>@react-pdf/renderer</code> y no en HTML con Chromium. La versión HTML rompía las curvas de los iconos, apilaba mal las capas y desfasaba el texto por diferencias de fuente. react-pdf calcula el layout por su cuenta, sin navegador, y da el mismo resultado cada vez.</p></div>
""")

section("datos", "Datos", f"""
{d_states()}
<div class="table-wrap"><table>
<thead><tr><th>Tabla (schema propel)</th><th>Qué guarda</th></tr></thead>
<tbody>
<tr><td><code>proposals</code></td><td>Una fila por propuesta: nombre, posesivo, forma corta, sitio, <code>campus_mode</code> (single o network), fecha, <code>status</code>, <code>approved_version</code>, <code>ai_images_used</code>, <code>cowork_thread_id</code> y el error si falló.</td></tr>
<tr><td><code>proposal_versions</code></td><td>Cada PDF generado: número de versión, ruta en Storage y peso.</td></tr>
<tr><td><code>proposal_photos</code></td><td>Las fotos de cada espacio: <code>slot</code> (cover, mission, centralized), <code>source</code> (site, ai, upload) y cuál está seleccionada.</td></tr>
<tr><td><code>proposals</code> (variantes)</td><td><code>recipe</code> (id de receta), <code>plan</code> (lista de módulos si se ajustó; vacío = la receta tal cual) y <code>module_data</code> (contenido por módulo con su origen: team o ai).</td></tr>
<tr><td><code>recipes</code></td><td>Recetas guardadas por el equipo: id, título, descripción y lista de módulos.</td></tr>
<tr><td><code>proposal_events</code></td><td>Bitácora: created, site_harvested, photo_set, plan_updated, module_content_set, rendered, recipe_saved, approved_and_delivered.</td></tr>
<tr><td><code>inbound_messages</code></td><td>El messageId de cada mensaje que llegó de Scale, para no procesarlo dos veces.</td></tr>
<tr><td><code>schema_migrations</code></td><td>Migraciones ya aplicadas.</td></tr>
</tbody></table></div>
<p>En Storage, el bucket privado <code>propel-proposals</code> guarda los PDFs como <code>{{proposal_id}}/v{{n}}.pdf</code> y los assets fijos en <code>_assets/</code>.</p>
""")

section("tools", "Tools del agente", """
<p>Una tool es una función que el modelo puede llamar. Viven en <code>agent/tools/</code>.</p>
<div class="table-wrap"><table>
<thead><tr><th>Tool</th><th>Qué hace</th><th>Aprobación</th></tr></thead>
<tbody>
<tr><td><code>start_proposal</code></td><td>Crea la propuesta con nombre, variantes del nombre, sitio, campus o red y receta. Si viene de Scale, guarda el id del hilo.</td><td>No</td></tr>
<tr><td><code>harvest_site_photos</code></td><td>Lee la home y /about con Firecrawl y devuelve las fotos de 600 px o más, de mayor a menor.</td><td>No</td></tr>
<tr><td><code>set_slot_photo</code></td><td>Asigna una foto (del sitio o una que mande el equipo) a un espacio.</td><td>No</td></tr>
<tr><td><code>generate_ai_photo</code></td><td>Genera la foto de un espacio con gpt-image-2. Tope de 6 por propuesta.</td><td>No</td></tr>
<tr><td><code>render_proposal</code></td><td>Arma el PDF según el plan: valida el contenido, comprueba que cada hoja quepa, comprime las fotos, bloquea si pasa de 8 MB y guarda una versión nueva.</td><td>No</td></tr>
<tr><td><code>deliver_proposal</code></td><td>Marca la propuesta como entregada con la versión aprobada.</td><td>Siempre</td></tr>
<tr><td><code>list_proposals</code></td><td>Lista las propuestas recientes con su estado.</td><td>No</td></tr>
<tr><td><code>list_modules</code></td><td>Catálogo de recetas y módulos, con qué contenido acepta cada uno y sus límites.</td><td>No</td></tr>
<tr><td><code>update_plan</code></td><td>Cambia de receta, o inserta, mueve o quita módulos. Así se pone una hoja donde lo pida la instrucción.</td><td>No</td></tr>
<tr><td><code>set_module_content</code></td><td>Guarda cifras o texto de un módulo (origen team o ai), lo valida y comprueba que la hoja quepa.</td><td>No</td></tr>
<tr><td><code>save_recipe</code></td><td>Guarda el orden de páginas de una propuesta como receta reutilizable.</td><td>No</td></tr>
</tbody></table></div>
<p>Además hay tres skills en <code>agent/skills/</code>: <code>photo-selection</code> (cómo elegir fotos), <code>school-name-variants</code> (posesivos y formas cortas del nombre) y <code>proposal-content</code> (qué pedir y cómo redactar el contenido de los módulos).</p>
""")

section("canales", "Canales", f"""
<h3>Telegram</h3>
{d_telegram()}
<p>El bot es <code>@trustedpropel_bot</code>. Telegram entrega los mensajes al webhook <code>/eve/v1/telegram</code> con un secret token. Para agregar a alguien o a un grupo, se suma su <code>chat.id</code> a <code>TELEGRAM_ALLOWED_CHAT_IDS</code>.</p>
<h3>Scale CRM</h3>
<p>El equipo habla con Propel en un canal tipo Slack (<code>#proposals</code>), con hilos. Un hilo es una conversación y una sesión del agente, y puede producir varias propuestas. Si varias personas escriben en el mismo hilo, cada mensaje llega al agente como <code>[Nombre] texto</code> y Propel responde a cada quien por su nombre.</p>
{d_scale()}
<h4>Contrato: Scale a Propel</h4>
<pre><code>POST https://propel-agent.vercel.app/cowork/message
Authorization: Bearer &lt;PROPEL_TASK_WEBHOOK_SECRET&gt;

{{
  "messageId": "id estable del mensaje",
  "threadId":  "raíz del hilo (una sesión por hilo)",
  "channelId": "id del canal",
  "author":    {{ "id": "...", "name": "Andrés" }},
  "text":      "Hazme la proposal de Aspire Public Schools...",
  "attachments": [{{ "fileName": "...", "url": "https://...", "mimeType": "image/png" }}]
}}
→ 200 {{"ok": true}}</code></pre>
<h4>Contrato: Propel a Scale</h4>
<pre><code>POST {{PROPEL_SCALE_WEBHOOK_URL}}   (la función propel-webhook de Scale)
Authorization: Bearer &lt;PROPEL_STATUS_WEBHOOK_SECRET&gt;

{{ "threadId": "...", "kind": "typing" }}
{{ "threadId": "...", "kind": "message", "text": "...",
   "attachments": [{{ "fileName": "Proposal - X.pdf", "url": "...", "mimeType": "application/pdf" }}] }}</code></pre>
<ul>
<li>Scale entrega cada mensaje al menos una vez. Propel descarta repetidos con <code>messageId</code>.</li>
<li>La palabra approve se manda sin envolver. Las variantes en español (aprobado, aprobada, aprobar) las traduce el canal.</li>
<li>El link del adjunto dura 24 horas. Scale descarga el PDF a su propio Storage apenas lo recibe.</li>
<li>Si el hilo no existe en Scale, el webhook responde 404 y Propel no reintenta.</li>
</ul>
""")

section("decisiones", "Decisiones y por qué", """
<div class="table-wrap"><table>
<thead><tr><th>Decisión</th><th>Por qué</th></tr></thead>
<tbody>
<tr><td>React-pdf en vez de HTML con Chromium</td><td>El HTML rompía curvas, capas y fuentes. React-pdf no depende de un navegador.</td></tr>
<tr><td>Las tools no devuelven URLs firmadas</td><td>El modelo las reescribe con errores. Los canales firman y suben el archivo.</td></tr>
<tr><td>Aprobación humana siempre</td><td>Es una propuesta comercial con precios. Nadie la entrega por error.</td></tr>
<tr><td>Tope de 6 imágenes con IA</td><td>Controla el costo y evita que el agente regenere sin parar.</td></tr>
<tr><td>Nada de stock</td><td>Riesgo con fotos de menores que parecen alumnos de la escuela.</td></tr>
<tr><td>Supabase de LandingPilot con schema propio</td><td>El plan gratis no permite otro proyecto.</td></tr>
<tr><td>Migraciones pegadas en el SQL Editor</td><td>No tenemos la cadena de conexión a la base. <code>scripts/setup-supabase.sql</code> reúne todo en un archivo. El runner <code>scripts/migrate.ts</code> existe por si algún día se tiene.</td></tr>
<tr><td>Scale como interfaz, no una web propia</td><td>El equipo ya trabaja ahí.</td></tr>
<tr><td>Hilos de conversación en vez de tarjetas Kanban</td><td>Se pide, se revisa y se corrige hablando, y varias personas pueden participar.</td></tr>
<tr><td>Plantilla en módulos y recetas</td><td>Las variantes (red, campus único, hojas extra de un trato) se arman como listas de módulos, sin duplicar páginas.</td></tr>
<tr><td>El contrato toma el precio de la opción recomendada</td><td>Si la hoja de red y el contrato tienen precios distintos, el PDF se contradice. La opción recomendada es la que se firma.</td></tr>
<tr><td>Las cifras son datos y los totales se calculan en código</td><td>Los precios de red son de cada trato y no hay tabla de descuentos. El modelo no multiplica ni inventa números.</td></tr>
<tr><td>El modelo puede proponer texto, marcado como suyo</td><td>Casi siempre el equipo da el texto. Cuando no, el modelo propone dentro de límites, y la vista previa avisa qué texto es suyo para que se revise antes de aprobar.</td></tr>
<tr><td>Páginas a la medida con bloques fijos</td><td>Flexibilidad sin diseño improvisado: la página se describe como datos y el renderer garantiza el estilo.</td></tr>
<tr><td>Chequeo de 1 página por hoja con contenido</td><td>Un texto largo partiría la hoja en dos sin que nadie lo note.</td></tr>
<tr><td>Imágenes fijas en JPEG y fotos comprimidas con sharp</td><td>Con los PNG originales, dos fotos de IA pasaban el tope de 8 MB, y el modelo terminaba repitiendo la misma foto para no pasarse.</td></tr>
<tr><td>Assets fijos en Storage</td><td>El bundle de Vercel no incluye archivos referenciados por ruta.</td></tr>
</tbody></table></div>
""")

section("seguridad", "Seguridad y límites", """
<div class="table-wrap"><table>
<thead><tr><th>Control</th><th>Cómo funciona</th></tr></thead>
<tbody>
<tr><td>Quién usa el bot</td><td>Lista de <code>chat.id</code> permitidos. Si la variable está vacía, el bot no acepta a nadie.</td></tr>
<tr><td>Secretos</td><td>En <code>.env.local</code>, que git ignora, y en variables de Vercel marcadas como sensitive. Nunca en el código ni en el chat.</td></tr>
<tr><td>Webhooks</td><td>Telegram con secret token. Scale con bearer secret y comparación en tiempo constante.</td></tr>
<tr><td>Base de datos</td><td>RLS activo sin policies: solo el rol <code>service_role</code> tiene acceso al schema <code>propel</code>.</td></tr>
<tr><td>Archivos</td><td>Bucket privado. Los links firmados duran 1 hora (preview en Telegram), 24 horas (adjuntos a Scale) o 30 días (entrega final).</td></tr>
<tr><td>Tamaño del PDF</td><td>Máximo 8 MB. Hoy pesa entre 2.4 y 3.1 MB.</td></tr>
<tr><td>Imágenes con IA</td><td>Máximo 6 por propuesta.</td></tr>
</tbody></table></div>
""")

section("costos", "Costos y rendimiento", """
<div class="grid">
<div class="card"><h3>Medido</h3><ul>
<li>Mensaje a preview: unos 40 segundos</li>
<li>PDF base: 2.9 MB (antes 7.5 MB). Red con página a la medida: 2.4 MB</li>
<li>Fotos en la prueba de Aspire: las 3 salieron del sitio, sin IA</li>
</ul></div>
<div class="card"><h3>Sin medir todavía</h3><ul>
<li>Costo de modelo por propuesta</li>
<li>Créditos de Firecrawl por propuesta (son 2 scrapes)</li>
<li>Costo de las imágenes con IA</li>
<li>Si el límite de tiempo de Vercel alcanza con 6 imágenes generadas</li>
</ul></div>
</div>
<p>Cómo medir el costo: AI Gateway no da desglose por corrida en este plan, pero sí el saldo. Se lee el saldo, se hace una propuesta completa y se vuelve a leer. La diferencia es el costo de esa corrida, siempre que nadie más use la misma key.</p>
""")

section("pendientes", "Pendientes por prioridad", """
<div class="table-wrap"><table>
<thead><tr><th>#</th><th>Pendiente</th><th>Por qué importa</th></tr></thead>
<tbody>
<tr><td>1</td><td>Aprobar la redacción del contrato para tratos de red</td><td>Ya está construida (sección 6), pero es texto legal: alguien debe aprobar las 4 frases antes de usarla con un cliente.</td></tr>
<tr><td>2</td><td>Definir y aprobar las frases de campus único</td><td>Hoy solo cambian 2 frases. El resto del PDF dice red, y el cliente lo ve.</td></tr>
<tr><td>3</td><td>Detectar texto encima de las fotos del sitio</td><td>El filtro por nombre de archivo atrapa portadas de blog, pero no un gráfico con nombre normal.</td></tr>
<tr><td>4</td><td>Probar el caso pesado en Vercel: 6 imágenes con IA</td><td>Puede pasar el límite de tiempo de la función.</td></tr>
<tr><td>5</td><td>Recetas desde Scale</td><td>La tabla <code>propel.recipes</code> ya existe. Falta la pantalla en Scale para armarlas sin el chat.</td></tr>
<tr><td>6</td><td>Probar nombres difíciles</td><td>Posesivos como St. Mary's, nombres terminados en s y nombres muy largos en la portada.</td></tr>
<tr><td>7</td><td>Medir el costo por propuesta</td><td>Hoy no se puede saber cuánto cuesta cada una.</td></tr>
<tr><td>8</td><td>Evals para elegir el modelo</td><td>Hay un fixture de PROUD Academy en <code>evals/fixtures</code>. Ahora también conviene uno de red con página a la medida.</td></tr>
<tr><td>9</td><td>Agregar el grupo de Telegram del equipo</td><td>Basta con sumar su <code>chat.id</code> a la lista permitida.</td></tr>
<tr><td>10</td><td>Decidir si la aprobación en Scale puede ser de un solo mensaje</td><td>Hoy son dos: "aprobado" y approve.</td></tr>
</tbody></table></div>
""")

section("repo", "Repo y cómo correrlo", """
<pre><code>proposal-creator/
├─ agent/
│  ├─ agent.ts            modelo y dependencias externas del build
│  ├─ instructions.md     identidad y reglas del agente
│  ├─ channels/           telegram.ts, cowork.ts (Scale)
│  ├─ tools/              las 7 tools
│  ├─ skills/             photo-selection, school-name-variants
│  └─ lib/                db, supabase, scrape, aiImage, images, names, cowork
├─ react/                 la plantilla del PDF
│  ├─ pages/              el diseño de cada página
│  ├─ modules/            registro de módulos: datos, fotos y render
│  ├─ recipes.ts          recetas (variantes), planes y validación del contenido
│  ├─ blocks.tsx          bloques de las hojas de trato y páginas a la medida
│  ├─ optimized/ (en template/full-service) imágenes fijas en JPEG
│  ├─ buildProposal.tsx   arma el documento y lo renderiza
│  └─ theme, fonts, icons, components, assets
├─ db/migrations/         0001_init.sql, 0002_cowork.sql, 0003_plans.sql
├─ scripts/               upload-assets.ts, optimize-assets.ts, migrate.ts,
│                         render_variants.tsx (muestras), e2e_variants.ts (integración)
├─ evals/fixtures/        casos de prueba (PROUD Academy)
└─ docs/                  prompt de integración con Scale</code></pre>
<h3>Comandos</h3>
<pre><code>npm install
npm run dev                   # agente en local con eve
npx tsx react/render.tsx      # genera template/full-service/react-preview.pdf
npm run typecheck
npx tsx scripts/render_variants.tsx /tmp/muestras   # PROUD, campus único, Noble y hojas sueltas
npx tsx --env-file=.env.local scripts/e2e_variants.ts &lt;proposalId con 3 fotos&gt;
npm run assets:upload         # sube los assets fijos a Storage
npx eve deploy --non-interactive --yes</code></pre>
<h3>Variables de entorno</h3>
<div class="table-wrap"><table>
<thead><tr><th>Variable</th><th>Para qué</th></tr></thead>
<tbody>
<tr><td><code>TELEGRAM_BOT_TOKEN</code>, <code>TELEGRAM_WEBHOOK_SECRET_TOKEN</code></td><td>Bot y verificación del webhook</td></tr>
<tr><td><code>TELEGRAM_ALLOWED_CHAT_IDS</code></td><td>Chats permitidos, separados por coma</td></tr>
<tr><td><code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code></td><td>Base de datos y Storage</td></tr>
<tr><td><code>AI_GATEWAY_API_KEY</code></td><td>Modelo e imágenes</td></tr>
<tr><td><code>FIRECRAWL_API_KEY</code></td><td>Leer el sitio de la escuela</td></tr>
<tr><td><code>PROPEL_TASK_WEBHOOK_SECRET</code></td><td>Autoriza a Scale a escribirle a Propel</td></tr>
<tr><td><code>PROPEL_STATUS_WEBHOOK_SECRET</code></td><td>Autoriza a Propel a escribirle a Scale</td></tr>
<tr><td><code>PROPEL_SCALE_WEBHOOK_URL</code> (opcional)</td><td>URL de propel-webhook, si cambia</td></tr>
</tbody></table></div>
""")

section("glosario", "Glosario", """
<div class="table-wrap"><table>
<thead><tr><th>Término</th><th>Significado</th></tr></thead>
<tbody>
<tr><td>eve</td><td>Framework de Vercel para agentes. Compila la carpeta <code>agent/</code> y la despliega.</td></tr>
<tr><td>Tool</td><td>Función que el modelo puede llamar.</td></tr>
<tr><td>Skill</td><td>Documento con criterios que el agente lee cuando le sirven.</td></tr>
<tr><td>Canal</td><td>Por donde entra y sale la conversación (Telegram, Scale).</td></tr>
<tr><td>Webhook</td><td>Una URL a la que otro servicio hace POST cuando pasa algo.</td></tr>
<tr><td>Outbox</td><td>Tabla de mensajes pendientes de enviar, con reintentos si falla la entrega.</td></tr>
<tr><td>URL firmada</td><td>Link temporal a un archivo privado, con un token que caduca.</td></tr>
<tr><td>RLS</td><td>Row Level Security de Postgres. Sin policies, nadie accede salvo el rol de servicio.</td></tr>
<tr><td>Módulo</td><td>Una pieza de la propuesta: una página, o el contrato que ocupa varias.</td></tr>
<tr><td>Receta</td><td>Lista ordenada de módulos que forma una variante de propuesta.</td></tr>
<tr><td>Plan</td><td>La receta ajustada para una propuesta concreta.</td></tr>
<tr><td>Página a la medida</td><td>Módulo <code>custom:&lt;slug&gt;</code> que se arma con bloques del sistema visual.</td></tr>
<tr><td>Hilo</td><td>Conversación en Scale. Equivale a una sesión del agente.</td></tr>
</tbody></table></div>
""")


# ───────────────────────── página ─────────────────────────


def numbered(sections):
    """Numera los diagramas en el orden en que aparecen (caption y aria-label)."""
    out, n = [], 0
    for sid, title, body in sections:
        def fig(m):
            nonlocal n
            n += 1
            return re.sub(r"Diagrama \d+\.", f"Diagrama {n}.", m.group(0))
        out.append((sid, title, re.sub(r'<figure class="diagram">.*?</figure>', fig, body, flags=re.S)))
    return out


def build():
    build_page(
        out=OUT,
        title="Propel PRD",
        hero="Propel genera la propuesta Full-Service en PDF.",
        lede="Le das el nombre de una escuela, su sitio web y si es un campus o una red. Propel busca las fotos, arma el PDF y una persona lo aprueba antes de entregarlo.",
        author="Andrés Mora",
        status="V1 funcionando",
        date="03.10.26",
        brand="Propel",
        sub="PRD · TrustED Solutions",
        sections=numbered(SECTIONS),
    )


if __name__ == "__main__":
    build()
