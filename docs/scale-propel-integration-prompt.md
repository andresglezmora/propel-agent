# Prompt para el repo `trusted-scale`: canal de conversación (tipo Slack) con el agente Propel

Contexto: Propel es un agente que genera propuestas comerciales en PDF. Quiero
hablar con él **en un canal de chat tipo Slack dentro de Scale, no en tarjetas
de Kanban**. Hoy Scale tiene la sección **Agents** con tarjetas (`tasks`,
`task_comments`) y la integración con LandingPilot (`landingpilot-dispatch`,
`landingpilot-webhook`, outbox con `claim_*`/`process_*`, migración
`20260925120000_landingpilot_agent_tasks.sql`, hook `useAgentTasks.ts`). Lee eso
y reutiliza sus patrones de outbox, secretos, RLS y tipos, pero **no** modeles
esto como tarjetas. Primero revisa si Scale ya tiene algo de mensajería/canales
que se pueda extender, y dime qué encontraste antes de crear tablas nuevas.

## 1. Producto (lo que el equipo debe poder hacer)
- Un módulo de **canales** con al menos el canal **#proposals** (el diseño debe
  permitir otros canales y otros agentes después, p. ej. LandingPilot).
- Mensajes con **hilos**: cada mensaje de nivel superior en #proposals puede abrir
  un hilo; Propel responde **dentro del hilo**. Todos los miembros del canal ven
  el hilo, pueden escribir en él y ver quién dijo qué.
- Reglas de cuándo se le habla a Propel: (a) cualquier mensaje en #proposals; (b)
  en otros canales, solo si mencionan `@Propel`. Los mensajes de humanos que no
  le hablan a Propel no se reenvían.
- Mensajes de **Propel** con etiqueta/avatar de agente, indicador **«Propel
  está escribiendo…»** mientras trabaja (puede tardar 30–90 s), y **adjuntos**
  (PDF) descargables con vista previa sencilla.
- Los humanos pueden **adjuntar imágenes** (p. ej. una foto de portada) al
  escribirle a Propel.
- Aprobación: Propel pide aprobar una entrega; se aprueba escribiendo `approve`
  en el hilo (o con un botón «Aprobar» que envíe ese mismo texto).
- Permisos: solo miembros del canal ven/escriben; RLS coherente con el resto de Scale.

## 2. Datos (migración nueva; adapta nombres a lo que ya exista)
`channels`, `channel_members`, `messages` (id, channel_id, thread_id nullable
→ raíz del hilo, author_type `user|agent`, author_id/agent_key, body,
created_at), `message_attachments` (message_id, file_name, mime_type,
storage_path, size_bytes) con bucket privado y signed URLs, y un outbox
`agent_outbox` (message_id, agent, attempts, next_attempt_at, status) con
backoff hasta 60 min, igual que el de LandingPilot. Realtime en `messages` para
que el hilo se actualice sin recargar.

## 3. Scale → Propel (edge function `propel-dispatch`)
Igual que `landingpilot-dispatch` (cron de pg_net cada minuto + disparo al
enviar; mismo `CRON_SHARED_SECRET`). Por cada mensaje que le toca a Propel:
```
POST https://propel-agent.vercel.app/cowork/message
Authorization: Bearer <PROPEL_TASK_WEBHOOK_SECRET>
Content-Type: application/json
{
  "messageId": "<messages.id>",          // estable: Propel deduplica por este id
  "threadId": "<id de la raíz del hilo>", // si el mensaje abre hilo, su propio id
  "channelId": "<channels.id>",
  "author": { "id": "<user id>", "name": "<nombre visible>" },
  "text": "...",                          // texto TAL CUAL, sin envolver ni prefijar
  "attachments": [ { "fileName": "...", "url": "<signed URL https, 1 h>", "mimeType": "image/png" } ]
}
```
- Respuesta esperada `200 {"ok":true}` en segundos. La respuesta de Propel llega
  después, por el webhook de la sección 4. Cualquier no-2xx → reintento con
  backoff (Propel es idempotente por `messageId`).
- Un hilo de Scale = una conversación de Propel: **usa siempre el mismo
  `threadId` para todos los mensajes del hilo**.
- Si se abre un hilo desde un mensaje suelto, ese mensaje es el primero que se
  envía con ese `threadId`.

## 4. Propel → Scale (edge function `propel-webhook`)
Igual que `landingpilot-webhook`: `verify_jwt = false`, auth propia
`Authorization: Bearer <PROPEL_STATUS_WEBHOOK_SECRET>` (comparación en tiempo
constante).
```
{ "threadId": "...", "kind": "message", "text": "...",
  "attachments": [ { "fileName": "Proposal - X.pdf", "url": "https://...signed", "mimeType": "application/pdf" } ] }
{ "threadId": "...", "kind": "typing" }
```
- `message`: inserta un mensaje del agente `propel` en ese hilo (`author_type =
  'agent'`). Por cada adjunto: **descarga la `url` en ese momento** (dura 24 h),
  guárdalo en el bucket privado y crea `message_attachments`. Valida: solo
  `application/pdf`, máx. 15 MB, y solo hosts `*.supabase.co`. Si la descarga
  falla, guarda el mensaje igual y añade «(no se pudo adjuntar el PDF)».
- `typing`: muestra «Propel está escribiendo…» ~60 s o hasta el siguiente
  mensaje del agente.
- Si el hilo no existe → responde 404 (Propel lo trata como no-error). Éxito →
  `200 {"ok":true}`. Propel reintenta 3 veces: sé idempotente razonable (no
  dupliques un mensaje idéntico del agente en la misma ventana de 10 s).

## 5. Secretos (no los imprimas ni los pegues en el chat)
En el proyecto Supabase de Scale: `PROPEL_TASK_WEBHOOK_SECRET` y
`PROPEL_STATUS_WEBHOOK_SECRET` (y opcional `PROPEL_TASK_URL`). Yo los cargo con
`supabase secrets set` desde el `.env.local` de Propel.

## 6. Cómo probarlo (criterios de aceptación)
1. En #proposals escribo: «Hazme la proposal de Aspire Public Schools,
   aspirepublicschools.org, red de campus». Aparece «Propel está escribiendo…».
2. En ~1 min Propel responde en el hilo con un resumen y un mensaje «Preview
   v1» con el PDF adjunto (`Proposal - Aspire Public Schools (preview v1).pdf`).
3. Otra persona escribe en el mismo hilo «cambia la foto de portada» → nueva
   versión adjunta; Propel llama a cada quien por su nombre.
4. Escribo `approve` → «Entregada (v2)» con el PDF final.
5. Reenviar dos veces el mismo `messageId` no duplica la respuesta.
6. Un mensaje humano en otro canal sin `@Propel` no llega a Propel.
Entrega: migración, las 2 edge functions, UI de canales/hilos, y un resumen de
qué probaste y qué no.
