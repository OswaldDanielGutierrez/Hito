# 04 · Plan de construcción

Trabaja por hitos, en orden. Al terminar cada uno: `typecheck`, `lint` y `test` en verde, commit y despliegue en Vercel. No avances si el criterio de "listo" no se cumple.

## M0 · Base
- Crear proyecto Next.js (App Router, TypeScript, Tailwind) y conectar el repositorio de GitHub.
- Cargar `design/tokens.json` como tema (colores, radios, fuente Plus Jakarta Sans).
- `src/config/app.ts` con `APP_NAME = "hito"`.
- Inicializar Supabase (`supabase init`, vincular el proyecto) y variables de entorno según `.env.example`.
- Desplegar en Vercel.

**Listo cuando:** la página de inicio vacía se ve en la URL de Vercel con la fuente y el fondo correctos.

## M1 · Datos y acceso
- Aplicar `0001_init.sql`. Generar tipos en `src/types/database.ts`.
- Login con correo. Rutas protegidas. Desactivar el registro público.
- Crear `user_settings` en el primer ingreso.
- Prueba de RLS con dos usuarios.

**Listo cuando:** solo el dueño entra y un segundo usuario de prueba no ve ningún dato.

## M2 · Lógica de dominio
- Implementar `src/lib/domain/*` con tests (casos en `03-datos.md`).

**Listo cuando:** todos los casos de salud, progreso, notas de fase y fechas pasan.

## M3 · Inicio
- Barra superior, indicadores, filtros, tarjetas de proyecto y tarjeta "Registrar proyecto".
- Datos con `project_overview`. Script `scripts/seed.ts`.
- Estados vacío y cargando.

**Listo cuando:** con los datos de ejemplo, Inicio coincide con la pantalla 1 de `02-diseno.md` y los filtros funcionan.

## M4 · Proyecto: Resumen y Fases y tareas
- Cabecera con pestañas, tarjetas de fases, tareas de la fase actual, aviso de fase corrida.
- Fases plegables, tabla de tareas, cambio de estado con un clic, agregar tarea en línea, panel de detalle.
- Editar fecha de fase con motivo y opción de desplazar las siguientes.
- Escribir en `activity_log` desde las Server Actions.

**Listo cuando:** cambiar el estado de una tarea actualiza avance y barras sin recargar, y mover una fecha deja registro con su motivo.

## M5 · Recursos, notas y contactos
- Tarjetas de recurso, filtros, pegar enlace (detección por dominio) y subir archivo a Storage.
- Fijar recursos y vincularlos a tareas. Notas y contactos.

**Listo cuando:** pegar un enlace de GitHub crea un recurso de tipo código con origen "GitHub", y un recurso fijado aparece en el Resumen.

## M6 · Registrar proyecto
- Diálogo de 3 pasos, plantillas, cálculo de fechas y entrega final.
- Crear proyecto, fases y reglas de alerta por defecto en una sola transacción.
- Editar proyecto, cambiar estado, archivar y eliminar.

**Listo cuando:** crear un proyecto desde la plantilla "Agente de IA" toma menos de 2 minutos y aparece en Inicio.

## M7 · Historial y alertas
- Pestaña Historial con reglas y canales.
- Edge Function `send-alerts`, pg_cron, campana con no leídas, correo con Resend.

**Listo cuando:** una fase con vencimiento en 2 días genera una notificación en la campana y un correo, y al ejecutar la función dos veces no se duplica.

## M8 · Pulido
- Búsqueda global (`Ctrl K`), PWA (manifest e íconos).
- Revisión de accesibilidad: teclado, foco, contraste, `aria`.
- Estados de error y toasts. Revisión de rendimiento.

**Listo cuando:** se puede usar toda la app solo con teclado y Lighthouse de accesibilidad marca 95 o más.

## Prompt inicial para Claude Code
```
Lee CLAUDE.md y los 4 documentos de docs/, además de design/tokens.json
y supabase/migrations/0001_init.sql.
Antes de escribir código, resúmeme en 10 líneas lo que entendiste de la app
y dime qué dudas tienes. Luego empieza por M0 y M1 de docs/04-plan-de-construccion.md.
```
