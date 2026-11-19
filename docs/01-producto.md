# 01 · Producto: objetivos y funciones

## Propósito
Un solo lugar donde un desarrollador de automatizaciones e IA ve, planea y entrega sus proyectos de trabajo. Cada proyecto tiene fases con fecha de entrega estimada, tareas, recursos a la mano y alertas que avisan antes de que algo se atrase.

## Objetivos
1. **Ver todo de un vistazo.** Al abrir la app, en menos de 5 segundos sé qué está atrasado, qué está en riesgo y qué viene esta semana.
2. **No perder una fecha.** Cada fase tiene entrega estimada y la app me avisa antes de que venza.
3. **Todo a la mano.** Documentos, flujos, repositorios y enlaces de cada proyecto están en un solo sitio, vinculados a su fase o tarea.
4. **Plan contra realidad.** Se conserva la fecha original de cada fase y el historial de cambios con su motivo, para ver cuánto se corrió.
5. **Registrar rápido.** Crear un proyecto con sus fases toma menos de 2 minutos usando plantillas.

### Cómo sé que funciona
- Registrar un proyecto con fases y fechas: menos de 2 min.
- Encontrar un recurso de un proyecto: máximo 2 clics desde Inicio.
- Ninguna fase vence sin haber recibido al menos una alerta.

## Usuario
Una sola persona (el dueño). Usa la app a diario, principalmente desde computador, pero también desde el celular u otra pantalla. La base de datos ya queda preparada para varios usuarios (`owner_id` + RLS), pero v1 no incluye colaboración.

## Alcance
**Dentro de v1:** acceso, inicio con todos los proyectos, pendientes diarios, registro y edición de proyectos, fases con fechas estimadas, tareas, recursos, notas y contactos, historial, alertas (en la app y por correo), búsqueda, instalable como PWA.

**Fuera de v1:** colaboración entre usuarios, control de tiempo, facturación, app móvil nativa (la web sí es responsive), guardar contraseñas, integraciones con Jira/Asana, modo oscuro.

## Glosario
| Término | Significado |
|---|---|
| Proyecto | Unidad de trabajo. Tiene área, responsable, estado, fases, tareas, recursos. |
| Estado | Etapa general del proyecto, la elige el usuario: Desarrollo, QA, Prod, Entregado, En espera. |
| Fase | Etapa interna ordenada (Levantamiento, Diseño, Desarrollo, QA...). Cada una tiene fecha de entrega estimada. |
| Entrega estimada | Fecha actual prevista para terminar una fase. |
| Plan original | Primera fecha estimada de la fase. No cambia aunque la fecha estimada se mueva. |
| Entrega final | La mayor fecha estimada entre las fases del proyecto. |
| Tarea | Trabajo concreto dentro de una fase. Tiene estado, prioridad, fecha y horas estimadas. |
| Recurso | Documento, flujo, código o enlace asociado al proyecto (y opcionalmente a una fase o tarea). |
| Salud | Indicador calculado: Al día, En riesgo, Atrasado, Detenido. |

## Funciones v1

### F1 · Acceso
- Inicio de sesión con correo (Supabase Auth). Sesión persistente.
- Registro público desactivado después de crear la cuenta del dueño.

### F2 · Inicio (portafolio)
- Saludo según la hora y 4 indicadores: proyectos activos, fases que terminan esta semana, tareas abiertas, fases atrasadas.
- Tarjeta por proyecto con: área, nombre, estado, barra de fases, fase actual y su fecha, avance de tareas, entrega final, conteo de recursos y última actualización.
- Filtros por estado con contador. Orden por entrega más cercana (entregados al final).
- Clic en tarjeta abre el proyecto.

### F3 · Registrar y editar proyecto
- Asistente de 3 pasos: datos generales, fases con fechas estimadas, recursos.
- Elegir plantilla de fases, ajustar nombres y fechas, agregar o quitar fases.
- Entrega final calculada automáticamente.
- Opción "Avisarme 2 días antes de cada fase" activada por defecto.

### F4 · Plantillas de fases
Tres plantillas del sistema: **Agente de IA**, **Automatización de flujos**, **App (bajo código o web)**. Las fechas se calculan desde la fecha de inicio más un desplazamiento en días. Se pueden guardar plantillas propias a partir de un proyecto.

### F5 · Resumen del proyecto
- Encabezado con estado, fase actual, fin de fase estimado, entrega final, responsable y avance.
- Tarjetas de fases con su entrega estimada y cómo terminaron.
- Tareas de la fase actual, recursos fijados y próximas alertas.
- Aviso cuando la fase actual está corrida respecto al plan original.

### F6 · Fases y tareas
- Fases plegables con fecha estimada editable, barra de distribución y avance.
- Tabla de tareas por fase: título, estado, prioridad, fecha, horas estimadas, recursos.
- Clic en el estado cambia al siguiente: Pendiente → En curso → Hecha → Bloqueada → Pendiente.
- Agregar tarea en línea; panel lateral para editar el detalle.
- Agregar, renombrar, reordenar y eliminar fases.
- Al mover la fecha de una fase se ofrece desplazar las siguientes los mismos días (opcional) y se pide un motivo (opcional).

### F7 · Recursos
- Tarjetas con tipo, origen, fase y fecha. Filtros: Todos, Documentos, Flujos y código, Enlaces.
- Agregar pegando un enlace o arrastrando un archivo. El tipo se detecta por el dominio (ver reglas).
- Fijar recursos para que salgan en el Resumen. Vincular recursos a tareas.
- Archivos se guardan en Supabase Storage (bucket privado).

### F8 · Notas y contactos
Lista de notas del proyecto y contactos (nombre, rol, detalle). Incluye un aviso fijo: la app nunca guarda contraseñas.

### F9 · Historial
Registro automático de cambios: estado, fechas de fase, tareas, fases y alcance. Muestra valor anterior, valor nuevo y motivo.

### F10 · Alertas
- Reglas por proyecto (ver sección Alertas) con interruptor.
- Canales: dentro de la app (campana) y correo. Teams queda para v2.
- Un job diario revisa fechas y genera las notificaciones.

### F11 · Búsqueda global
Campo de la barra superior. Busca en proyectos, tareas y recursos. Atajo `Ctrl K` para enfocarlo.

### F12 · Instalable (PWA)
Manifest e íconos para instalarla como app de escritorio. Sin modo sin conexión en v1.

### F13 · Cambiar estado del proyecto
Diálogo con el nuevo estado y nota opcional. Se registra en el historial. Pasar a "Entregado" sugiere completar las fases pendientes.

### F14 · Archivar o eliminar
Archivar oculta el proyecto del Inicio. Eliminar exige escribir el nombre del proyecto.

### F15 · Pendientes
Pantalla `/pendientes` para anotar tareas sueltas del día, aunque no estén en el plan de un proyecto. Cada pendiente indica el proyecto (opcional) y quién lo pidió. Se agregan escribiendo el título y presionando Enter; se marcan como hechos con un clic; se ven agrupados por día (Atrasados, Hoy, Mañana, Esta semana, Próxima semana, Sin fecha) y se filtran por día, solicitante y proyecto. Reemplaza a "Mis tareas". Detalle completo en `docs/05-pendientes.md`.

## Reglas de negocio

### Salud del proyecto
`hoy` es la fecha actual en `America/Bogota`.
```
estado == delivered                         → sin salud (se muestra "Entregado")
estado == on_hold                           → Detenido
existe fase no completada con fecha < hoy,
o entrega final < hoy                       → Atrasado
entrega final - hoy <= 3 días,
o fase actual vence en <= 2 días
   y tiene tareas sin terminar              → En riesgo
en otro caso                                → Al día
```

### Progreso
- Avance del proyecto = tareas hechas / tareas totales (solo tareas de primer nivel). Sin tareas = 0 %.
- Avance de una fase = igual, filtrado por fase.

### Fase actual
Primera fase (por posición) que no está completada. Al completar una fase, la siguiente pasa a "en curso".

### Nota de cada fase (texto bajo la fecha)
| Situación | Texto | Color |
|---|---|---|
| Completada con `completed_at <= fecha estimada` | Terminó a tiempo | #00652F |
| Completada después | Terminó el dd/MM · N días tarde | #B42318 |
| En curso y estimada = original | En curso | #8A4A0B |
| En curso y estimada ≠ original | En curso · plan inicial dd/MM | #8A4A0B |
| Futura | Próxima | #58635D |

### Texto de días
`En N días`, `Mañana`, `Hoy`, `N días tarde`. Color: atrasado #B42318, 3 días o menos #8A4A0B, resto #58635D.

### Detección de recursos por URL
| Dominio | Tipo | Origen |
|---|---|---|
| github.com | code | GitHub |
| sharepoint.com, onedrive | document | SharePoint |
| docs.google.com | document | Google Docs |
| make.powerautomate.com, flow.microsoft.com | flow | Power Automate |
| n8n.* | flow | n8n |
| figma.com | link | Figma |
| otro | link | el dominio |

### Historial
Cada cambio de estado, fecha de fase, estado de tarea, alta o baja de fase o tarea escribe una fila en `activity_log` desde la Server Action correspondiente, con `old_value`, `new_value` y `reason`.

### Contraseñas
La app no guarda contraseñas ni llaves. Un recurso de tipo enlace puede apuntar a la entrada del gestor de contraseñas.

## Alertas

Zona horaria `America/Bogota`. Reglas que se crean por defecto en cada proyecto:

| Regla (`alert_kind`) | Cuándo | Hora |
|---|---|---|
| `phase_due_soon` | 2 días antes de cada fase no completada | 09:00 |
| `final_due` | 3 días antes, 1 día antes y el día de la entrega final | 09:00 (el día: 08:00) |
| `task_due` | El día anterior al vencimiento de cada tarea no hecha | 09:00 |
| `stale` | Proyecto activo con 5 días sin cambios | 09:00 |
| `overdue` | Cada día mientras haya una fase o entrega atrasada | 09:00 |
| `weekly_summary` | Lunes: fases de la semana, atrasos y tareas bloqueadas | 07:30 |

Funcionamiento:
- Una Edge Function `send-alerts` corre cada día a las 07:00 (12:00 UTC) con pg_cron. El resumen semanal corre los lunes a las 07:30.
- Genera filas en `notifications` y envía el correo (Resend). Es idempotente: la clave única evita duplicados si corre dos veces.
- La campana de la barra superior muestra las no leídas y permite marcarlas como leídas.

## Funciones v2
- Pantalla **Calendario** con fases y tareas.
- Alertas por Microsoft Teams.
- Subtareas (el esquema ya incluye `parent_task_id`).
- Vista tipo cronograma por fases.
- Arrastrar y soltar para reordenar fases y tareas.
- Exportar a Excel.
- Comando de lenguaje natural (por ejemplo, "pasa X a QA y avísame el jueves").

## Etiquetas en español
| Valor | Etiqueta |
|---|---|
| `development` | Desarrollo |
| `qa` | QA |
| `production` | Prod |
| `delivered` | Entregado |
| `on_hold` | En espera |
| `pending` | Pendiente |
| `in_progress` | En curso |
| `done` | Hecha |
| `blocked` | Bloqueada |
| `high` / `medium` / `low` | Alta / Media / Baja |
| `document` / `flow` / `code` / `link` | Documento / Flujo / Código / Enlace |
| `on_track` / `at_risk` / `late` / `on_hold` | Al día / En riesgo / Atrasado / Detenido |
