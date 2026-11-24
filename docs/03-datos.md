# 03 · Modelo de datos

El esquema completo está en `supabase/migrations/0001_init.sql`. Este documento explica las decisiones.

## Relaciones
```
auth.users
   └─ projects ──┬─ phases ──── tasks (parent_task_id → subtareas)
                 ├─ resources ── task_resources ── tasks
                 ├─ project_notes
                 ├─ project_contacts
                 ├─ activity_log
                 ├─ alert_rules
                 └─ notifications
phase_templates   (owner_id null = plantilla del sistema)
user_settings     (una fila por usuario)
```

## Tablas
| Tabla | Para qué |
|---|---|
| `projects` | Proyecto: nombre, área, responsable, estado, inicio, archivado. |
| `phases` | Fases ordenadas por `position`. `estimated_date` es la vigente; `original_date` es el plan original y se fija sola la primera vez. |
| `tasks` | Tareas de una fase. `parent_task_id` queda listo para subtareas (UI en v2). `completed_at` lo pone un trigger. |
| `resources` | Documentos, flujos, código y enlaces. `url` o `storage_path` (archivo subido). `pinned` los muestra en el Resumen. |
| `task_resources` | Vincula recursos con tareas (muchos a muchos). |
| `project_notes`, `project_contacts` | Notas y contactos del proyecto. |
| `activity_log` | Historial: tipo de cambio, valor anterior, valor nuevo, motivo. |
| `phase_templates` | Plantillas de fases. `phases` es JSON: `[{ "name", "offset_days" }]`. |
| `alert_rules` | Reglas de alerta por proyecto (o globales con `project_id` null). |
| `notifications` | Alertas generadas. Clave única para no duplicarlas. |
| `user_settings` | Zona horaria, nombre, canales. |
| `quick_tasks` | Pendientes sueltos del día (pantalla Pendientes): título, proyecto opcional, quién lo pidió, fecha, prioridad y estado. Ver `docs/05-pendientes.md`. |
| `tags` | Etiquetas del usuario: nombre (único sin distinguir mayúsculas) y color de una paleta fija. |
| `project_tags` | Asignación de etiquetas a proyectos (`project_id`, `tag_id`). |
| `quick_task_tags` | Asignación de etiquetas a pendientes (`quick_task_id`, `tag_id`). |

## Enums
| Enum | Valores |
|---|---|
| `project_status` | development, qa, production, delivered, on_hold |
| `phase_status` | pending, in_progress, completed |
| `task_state` | pending, in_progress, done, blocked |
| `task_priority` | high, medium, low |
| `resource_kind` | document, flow, code, link |
| `change_kind` | status, date, task, phase, scope |
| `alert_kind` | phase_due_soon, final_due, task_due, stale, overdue, weekly_summary |

La salud (`on_track`, `at_risk`, `late`, `on_hold`) **no** es un enum de BD: se calcula en `src/lib/domain/health.ts` con las reglas de `01-producto.md`.

## Seguridad
- RLS activado en todas las tablas. Política: `owner_id = auth.uid()`.
- Las plantillas del sistema (`owner_id` null) se pueden leer pero no modificar.
- `owner_id` tiene `default auth.uid()`: el cliente no necesita enviarlo.
- La vista `project_overview` usa `security_invoker`, así respeta la RLS de las tablas base.
- Archivos: bucket privado `project-files`, ruta `{user_id}/{project_id}/{archivo}`, con políticas por carpeta de usuario.
- Probar con dos usuarios de prueba que ninguno ve datos del otro.

## Triggers
- `updated_at` en projects, phases, tasks y resources.
- `phases.original_date` se copia de `estimated_date` si está vacía.
- `tasks.completed_at` se llena al pasar a `done` y se limpia al salir.

El historial **no** usa triggers: lo escriben las Server Actions para poder guardar el motivo.

## Vista del portafolio
`project_overview` entrega por proyecto: entrega final, fases (total y hechas), fase actual, tareas (total y hechas) y conteo de recursos por tipo. Con eso se pinta la tarjeta de Inicio sin consultas adicionales; solo falta traer los nombres de las fases para `PhaseSegments`.

## Tipos y etiquetas en TypeScript
```ts
// src/lib/labels.ts
export const projectStatusLabel = {
  development: "Desarrollo", qa: "QA", production: "Prod", delivered: "Entregado", on_hold: "En espera",
} as const;
export const taskStateLabel = {
  pending: "Pendiente", in_progress: "En curso", done: "Hecha", blocked: "Bloqueada",
} as const;
export const taskStateNext = {
  pending: "in_progress", in_progress: "done", done: "blocked", blocked: "pending",
} as const;
export const priorityLabel = { high: "Alta", medium: "Media", low: "Baja" } as const;
export const resourceKindLabel = {
  document: "Documento", flow: "Flujo", code: "Código", link: "Enlace",
} as const;
export const healthLabel = {
  on_track: "Al día", at_risk: "En riesgo", late: "Atrasado", on_hold: "Detenido",
} as const;
```

## Funciones de dominio (con tests)
Archivos en `src/lib/domain/`:
- `health.ts`: `getHealth(project, phases, tasks, today)`.
- `progress.ts`: avance de proyecto y de fase.
- `phaseNote.ts`: texto y color bajo la fecha de cada fase.
- `dates.ts`: `daysUntil`, `formatDate` (dd/MM/yyyy), texto de días ("En 2 días", "Hoy", "3 días tarde") y semana actual, siempre en `America/Bogota`.
- `templates.ts`: calcular fechas de fases desde la fecha de inicio y `offset_days`.
- `resourceDetect.ts`: tipo y origen según la URL.

Casos mínimos de prueba: proyecto atrasado, en riesgo por entrega a 3 días, en riesgo por fase a 2 días con tareas abiertas, al día, detenido, entregado; fase completada a tiempo y tarde; plan original distinto de estimada.

## Alertas: tareas programadas
1. Activar las extensiones `pg_cron` y `pg_net` en Supabase.
2. Programar `send-alerts` todos los días a las `0 12 * * *` (07:00 Bogotá) y el resumen semanal los lunes a las `30 12 * * 1` (07:30 Bogotá).
3. La llamada a la Edge Function usa la llave de servicio guardada en **Vault**, nunca escrita en el SQL.
4. `send-alerts`:
   - lee `alert_rules` activas con sus proyectos, fases y tareas;
   - decide qué alertas tocan hoy según `days_before`;
   - inserta en `notifications` (la clave única evita duplicados);
   - envía el correo con Resend a las notificaciones con `channel = 'email'` y marca `sent_at`.

## Datos de ejemplo
`scripts/seed.ts` (solo desarrollo): usa la llave de servicio, recibe el correo del dueño por argumento y crea los datos descritos al final de `02-diseno.md`. No incluir nombres de empresas reales.

## Importación del levantamiento de procesos (Excel)

Los Excel de `docs/Proyectos/` (Compras, Contabilidad, Tesorería) tienen un proceso por fila en la hoja «Formato».
No se suben a git (repositorio público, datos internos). `scripts/import-levantamiento.mjs` los carga como proyectos:

- Cada proceso es un proyecto: nombre, área, responsable (persona de contacto del área) y estado **En espera**.
- Fases: «Levantamiento» (completada, sin fecha estimada) y «Análisis de viabilidad» (en curso, sin fecha).
- Una nota «Ficha del levantamiento» con frecuencia, tiempos, sistemas, dificultad, impacto y lo que esperan.
- Contactos: persona de contacto y líder del área. Reglas de alerta por defecto, como en un proyecto nuevo.
- Es idempotente (omite los que ya existen por nombre) y borra el proyecto en curso si algo falla.
