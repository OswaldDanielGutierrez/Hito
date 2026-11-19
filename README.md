# hito

Gestor de proyectos personal para proyectos de automatización e IA. Cada proyecto tiene fases con fecha de entrega estimada, tareas, recursos a la mano (documentos, flujos, código, enlaces) y alertas antes de que algo se atrase.

> "hito" es un nombre provisional. Se cambia en un solo lugar: `src/config/app.ts` (`APP_NAME`).

**Estado:** v1 completa (M0 a M8) y en producción. La app es **100% responsive** (desde 320 px) e instalable como PWA. Solo falta activar el envío de correo con Resend (ver más abajo).

## Por dónde empezar

Lee en este orden:

| # | Archivo | Qué responde |
|---|---|---|
| 1 | [docs/01-producto.md](docs/01-producto.md) | ¿Qué hace la app y cuáles son sus reglas? Objetivos, funciones, reglas de negocio, alertas |
| 2 | [docs/02-diseno.md](docs/02-diseno.md) | ¿Cómo se ve? Colores, tipografía, componentes y las 6 pantallas |
| 3 | [docs/03-datos.md](docs/03-datos.md) | ¿Cómo se guardan los datos? Tablas, seguridad (RLS), triggers, alertas programadas |
| 4 | [docs/04-plan-de-construccion.md](docs/04-plan-de-construccion.md) | ¿En qué orden se construye? Hitos M0 a M8 y criterio de "listo" de cada uno |

## Mapa de carpetas

```
GestionProyectos/
├── CLAUDE.md                  Instrucciones y convenciones para Claude Code
├── README.md                  Este archivo
├── .env.example               Plantilla de variables de entorno (copiar a .env.local)
├── .gitignore
├── docs/                      Especificación en lenguaje natural
├── design/
│   └── tokens.json            Colores, tipografía, radios y sombras
├── supabase/
│   └── migrations/
│       └── 0001_init.sql      Esquema inicial de la base de datos
└── _archivo/                  Respaldo del zip original (no se sube a git)
```

Cuando empiece el desarrollo se agregarán `src/` (la app Next.js) y `supabase/functions/` (alertas).

## Stack

- **App:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Datos y acceso:** Supabase (Postgres, Auth, Storage, Edge Functions, pg_cron)
- **Despliegue:** Vercel (plan Hobby)
- **Correo de alertas:** Resend

## Resumen de funciones v1

Acceso con correo · Inicio con todos los proyectos · Registro con plantillas de fases · Fases y tareas · Recursos, notas y contactos · Historial de cambios · Alertas en la app y por correo · Búsqueda global (`Ctrl K`) · Instalable como PWA.

Además de lo anterior: bloc de notas por proyecto, Mis tareas, archivados, Mi cuenta (nombre y contraseña) y administración de fases (renombrar, mover, eliminar).

Quedan para v2: Calendario, alertas por Teams, subtareas, cronograma, exportar a Excel.

## Hitos de construcción

| Hito | Contenido |
|---|---|
| M0 ✅ | Base: proyecto Next.js, tema, Supabase, Vercel |
| M1 ✅ | Datos y acceso: migración, login, RLS |
| M2 ✅ | Lógica de dominio con tests |
| M3 ✅ | Pantalla Inicio |
| M4 ✅ | Proyecto: Resumen y Fases y tareas |
| M5 ✅ | Recursos, notas y contactos |
| M6 ✅ | Registrar proyecto |
| M7 ✅ | Historial y alertas |
| M8 ✅ | Pulido: búsqueda, PWA, accesibilidad |

Detalle y criterios de "listo" en [docs/04-plan-de-construccion.md](docs/04-plan-de-construccion.md).

## Activar el correo de alertas

Las alertas dentro de la app ya funcionan solas (`pg_cron` ejecuta `generate_alerts()` todos los días a las 7:00 de Bogotá). El **correo** está construido pero apagado hasta que tengas Resend:

1. Crea una cuenta en https://resend.com, genera una API key y verifica el dominio o correo remitente.
2. Guarda los secretos de la función: `npx supabase secrets set RESEND_API_KEY=... ALERTS_FROM_EMAIL=...` (opcional `SITE_URL`).
3. En el editor SQL de Supabase guarda la conexión en Vault (nunca en el repositorio):
   ```sql
   select vault.create_secret('https://nqndzntboclwfzdotqiu.supabase.co', 'project_url');
   select vault.create_secret('<clave service_role legacy (eyJ...)>', 'service_role_key');
   ```
4. Listo: a las 7:10 de Bogotá `dispatch_email_alerts()` llama a la función `send-alerts`, que envía los correos pendientes y los marca como enviados.

## Reglas que no se negocian

- Nunca subir secretos. `.env.local` está en `.gitignore`.
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor y Edge Functions, jamás con prefijo `NEXT_PUBLIC_`.
- RLS activo en todas las tablas.
- La app nunca guarda contraseñas: un recurso solo puede apuntar a dónde está una.
