# hito — gestor de proyectos personal

App web personal para gestionar proyectos de automatización e IA. Cada proyecto tiene fases (cada una con fecha de entrega estimada), tareas, recursos a la mano (documentos, flujos, código, enlaces) y alertas por fechas. Un solo usuario (el dueño). Responsive al 100%: se usa y se ve bien en cualquier pantalla y resolución, desde un celular de 320 px hasta monitores grandes.

> "hito" es un nombre provisional. Está centralizado en `src/config/app.ts` (`APP_NAME`) para cambiarlo en un solo lugar.

## Lee esto primero (en orden)
1. `docs/01-producto.md` — objetivos, funciones, reglas de negocio y alertas.
2. `docs/02-diseno.md` — sistema visual y pantallas, con medidas, colores y estados.
3. `docs/03-datos.md` + `supabase/migrations/0001_init.sql` — modelo de datos y RLS.
4. `docs/04-plan-de-construccion.md` — hitos de trabajo y criterios de "listo".
5. `design/tokens.json` — tokens de color, tipografía y radios.

## Stack
- Next.js (App Router) + TypeScript estricto. Usa las versiones estables más recientes.
- Tailwind CSS. Tokens de `design/tokens.json` como variables CSS / tema.
- Supabase: Postgres, Auth, Storage, Edge Functions, pg_cron.
- Despliegue en Vercel (plan Hobby, uso personal).
- Zod para validar, date-fns con locale `es` para fechas.
- Sin librería de UI pesada. Componentes propios; Radix primitives solo para dialog, popover, tooltip y dropdown.
- Íconos: lucide-react, trazo 1.9, 18 px.

## Comandos
```
npm run dev | build | lint | typecheck | test
supabase start | db reset | db push | gen types typescript --local > src/types/database.ts
```

## Estructura sugerida
```
src/app/(auth)/login
src/app/(app)/page.tsx                    Inicio
src/app/(app)/proyectos/[id]/page.tsx     Resumen
src/app/(app)/proyectos/[id]/fases        Fases y tareas
src/app/(app)/proyectos/[id]/recursos     Recursos
src/app/(app)/proyectos/[id]/historial    Historial y alertas
src/components/ui                          Button, Chip, StatusLabel, Bar, Card, Dialog...
src/components/domain                      ProjectCard, PhaseCard, TaskTable...
src/lib/domain                             Lógica pura con tests: salud, progreso, fechas
src/lib/supabase/{server,client}.ts
src/lib/labels.ts                          Etiquetas en español de los enums
src/config/app.ts
supabase/migrations  supabase/functions/send-alerts
```

## Convenciones
- Identificadores de código y base de datos en inglés. Textos de la interfaz en español (es-CO).
- Fechas `dd/MM/yyyy`. Zona horaria `America/Bogota`. Números con `tabular-nums`.
- Server Components por defecto. Mutaciones con Server Actions validadas con Zod.
- La lógica de negocio (salud, progreso, notas de fase, días restantes) vive en `src/lib/domain` como funciones puras con tests.
- Tipos de BD generados en `src/types/database.ts`. No editarlos a mano.
- Cada cambio de base de datos es un archivo nuevo en `supabase/migrations`.
- Responsive obligatorio (mobile-first): toda pantalla nueva se verifica a 320, 375, 768, 1024, 1440 y 1920 px, sin desborde horizontal de la página. Campos de formulario con 16 px en móvil, objetivos táctiles de al menos 40 px y diálogos que caben en pantalla.
- Accesibilidad: HTML semántico, foco visible, `aria-label` en botones de ícono, contraste AA. Nunca comunicar algo solo con color: siempre hay texto.
- Respeta `prefers-reduced-motion`.

## Seguridad (obligatorio)
- Nunca subir secretos. `.env.local` está en `.gitignore`. Usa `.env.example` como guía.
- `SUPABASE_SERVICE_ROLE_KEY` solo en Edge Functions o servidor. Jamás con prefijo `NEXT_PUBLIC_`.
- RLS activo en todas las tablas; cada fila tiene `owner_id`.
- Registro público de usuarios desactivado en Supabase una vez creada la cuenta del dueño.
- La app nunca guarda contraseñas ni llaves. Un recurso solo puede apuntar a dónde está una credencial (por ejemplo, el gestor de contraseñas).
- Pide confirmación antes de migraciones destructivas o de borrar datos.

## No hacer
- No barra lateral. La navegación es la barra superior.
- No modo oscuro en v1. No app móvil nativa (la versión web sí es responsive).
- No agregar dependencias grandes sin preguntar.
- No guardar datos en `localStorage`. Todo va a Supabase.
- No inventar pantallas que no estén en `docs/02-diseno.md`; si falta una, usa los mismos componentes y pregunta.

## Definición de "listo"
`typecheck`, `lint` y `test` pasan. RLS verificado (un usuario no ve datos de otro). La pantalla coincide con `docs/02-diseno.md` y es usable en celular (320 px) sin desborde horizontal. Se puede usar solo con teclado. Estados vacío, cargando y error cubiertos.
