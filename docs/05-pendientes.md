# 05 · Pendientes (pantalla nueva)

Pantalla para anotar tareas diarias sueltas: lo que te piden en el día, aunque no esté en el plan de un proyecto. Cada pendiente indica **a qué proyecto pertenece** (opcional) y **quién lo pidió**.

Ruta: `/pendientes`. Se suma a los documentos existentes; no reemplaza nada de `docs/01` a `docs/04`.

## Página de un pendiente (`/pendientes/[id]`)

Se abre desde el enlace de la tarjeta («Apuntes · 1 nota · 2 adjuntos» o «Abrir»), el menú ⋯ → «Abrir pendiente» o la búsqueda Ctrl K. Misma barra superior que el resto; contenido en `max-w-[1376px]`.

1. **Encabezado** (Card): ruta «Pendientes / título», H1 con el título (tachado y gris si está hecho), botón **Marcar como hecho / Volver a pendiente** y selector de **Etiquetas**; debajo, Proyecto, Pidió, Fecha límite (misma etiqueta de color que la tarjeta), Prioridad (si es alta) y **Creado** (fecha y hora, no editable).
2. **Columna izquierda (70 %, `lg:grid-cols-[7fr_3fr]`): Escritura libre.** Mismo editor que el bloc de notas del proyecto: autoguardado a los 800 ms, estado «Guardado / Guardando… / No se pudo guardar», límite de 50.000 caracteres. Se guarda en `quick_tasks.notepad`.
3. **Columna derecha (30 %):**
   - **Notas importantes:** lista con fecha y hora (marca «editada»), editar y eliminar con confirmación; campo para agregar una nueva.
   - **Adjuntos:** lista con icono (archivo o enlace), nombre que abre en pestaña nueva, origen y fecha; eliminar con confirmación. Debajo, «Adjuntar archivo» (varios, hasta 25 MB cada uno) y formulario de enlace (nombre opcional; si falta se sugiere desde la URL).
4. Por debajo de 1024 px las columnas se apilan: escritura libre primero y luego notas importantes y adjuntos.
5. Estados: cargando (esqueleto), no encontrado («No encontramos este pendiente»), vacíos de adjuntos y notas.

**Eliminar:** si el pendiente tiene apuntes, notas o adjuntos se pide confirmación y no hay «Deshacer». Los archivos adjuntos se borran del almacenamiento.

## Instrucciones para Claude Code
Al implementar esta pantalla, aplica también estos ajustes menores:
1. **Barra superior** (`docs/02-diseno.md`, componente TopBar): los enlaces pasan a ser **Proyectos, Pendientes, Calendario**. "Mis tareas" desaparece; Pendientes cumple ese papel. Pendientes queda activo en `/pendientes`.
2. **`CLAUDE.md`**: agrega `docs/05-pendientes.md` a la lista de lectura y `src/app/(app)/pendientes` a la estructura.
3. **`docs/01-producto.md`**: agrega la función F15 (abajo) y quita "Mis tareas" de las funciones v2.
4. **`docs/04-plan-de-construccion.md`**: agrega el hito M3b (abajo).
5. **Base de datos**: crea `supabase/migrations/0002_pendientes.sql` con el SQL de la sección "Datos" y regenera los tipos.
6. **Búsqueda global** (F11): incluir también el título y el solicitante de los pendientes.

## Objetivo
Capturar en segundos una petición del día y ver de un vistazo qué está atrasado, qué es para hoy y quién te está pidiendo más cosas.

## Función F15 · Pendientes
- Agregar un pendiente escribiendo el título y presionando Enter. Opcionalmente: proyecto, quién lo pidió, fecha y prioridad alta.
- Marcar como hecho con un clic en la casilla (se puede desmarcar).
- Ver los pendientes en tarjetas rectangulares agrupadas por día: Atrasados, Hoy, Mañana, Esta semana, Próxima semana, Sin fecha.
- Filtrar por día (pastillas), por solicitante y por proyecto (selectores «Pidió» y «Proyecto») y por etiqueta.
- Ver el avance del día y cuántos pendientes abiertos tiene cada solicitante y cada proyecto.

## Diseño

Usa los tokens de `design/tokens.json` y los componentes de `docs/02-diseno.md` (TopBar, Button, FilterPill, Card).

### Estructura
`main` centrado, ancho máximo 1600 px, relleno 28 × 32, separación vertical 20. **No hay panel lateral**: el contenido usa todo el ancho para ver varios pendientes a la vez.

1. **Encabezado:** fecha ("Miércoles, 18/11/2026", 14 muted), H1 "Pendientes" (30/38, peso 800, tracking -0.02em) y subtítulo "Lo que te piden en el día, aunque no esté en el plan de un proyecto." (14 muted). A la derecha, casilla "Mostrar hechos" (marcada por defecto).
2. **Contenido a todo el ancho** (separación 18): compositor, pastillas de día, selectores «Pidió» y «Proyecto», etiquetas, filtros activos y secciones.
3. Las tarjetas se reparten en 1 columna (menos de 640 px), 2 (≥ 640), 3 (≥ 1024), 4 (≥ 1280) y 5 (≥ 1536).

### Compositor (rectángulo para agregar)
Tarjeta blanca, borde 2 px #B5D8C4, radio 16, relleno 16 × 18, sombra `0 4px 16px rgba(2,44,23,.06)`. Con foco dentro, el borde pasa a #007A3D.

- **Fila 1:** círculo de 32 px (fondo #E4F5EB, ícono + #007A3D) y campo de texto sin borde, 17/600, placeholder "¿Qué te pidieron? Escríbelo y presiona Enter".
- **Fila 2** (borde superior #EEF2F0, relleno superior 14, separación 10, con salto de línea):
  - Campo **Proyecto**: caja de 38 de alto, borde 1 px #7F8A84, radio 8; etiqueta "Proyecto" (12/600 muted) dentro, y un `select` con "Sin proyecto" y los proyectos no archivados ni entregados.
  - Campo **Pidió**: igual, con `input` de 120 px y `datalist` con los solicitantes usados antes más "Yo". Acepta nombres nuevos.
  - **Fecha:** control segmentado (fondo #EEF2F0, relleno 3, radio 8) con Hoy, Mañana, Esta semana y Sin fecha. Activo: fondo blanco con sombra suave.
  - **Alta prioridad:** botón de 38 de alto con ícono de bandera, `aria-pressed`. Activo: fondo #FDECEA, borde y texto #B42318.
  - **Agregar:** botón primario a la derecha, ícono +.
- Al agregar: se limpian el título y la prioridad; se conservan proyecto, solicitante y fecha para capturar varios seguidos. Título vacío no agrega nada. Solicitante vacío se guarda como "Yo".

### Pastillas de día
FilterPill con contador de pendientes **abiertos**: Todos, Hoy (atrasados + hoy), Mañana, Próximos (esta semana + próxima semana), Sin fecha.

### Filtros activos
Si hay filtro por proyecto o solicitante, aparece la fila "Filtrando por" con una pastilla por filtro (fondo #E4F5EB, borde #B5D8C4, texto #04512A, 13/700) y una "×" para quitarlo (`aria-label` "Quitar filtro de …").

### Secciones
En este orden: **Atrasados, Hoy, Mañana, Esta semana, Próxima semana, Sin fecha**. Solo se muestran las que tienen tarjetas.
- Encabezado: título 16/800 + contador de abiertos (pastilla 12/700, fondo #EEF2F0) + rango de fechas (12/600 muted, tabular): Hoy "Mié 18/11", Mañana "Jue 19/11", Esta semana "Vie 20/11 – Dom 22/11", Próxima semana "Desde Lun 23/11".
- **Atrasados** va en rojo: título y contador en #B42318, contador con fondo #FDECEA.
- **Sin secciones:** todos los pendientes visibles van juntos en una sola cuadrícula, abiertos primero (atrasados, hoy, mañana, esta semana, próxima semana y sin fecha, en ese orden) y hechos al final. Cada tarjeta indica su fecha con la etiqueta de color (Hoy, Mañana, Atrasado…). Los hechos de días anteriores siguen en «Hechos anteriores».
- Cuadrícula de 1 a 5 columnas según el ancho (ver Estructura), separación 12.
- Toda la tarjeta es un enlace a `/pendientes/[id]` (el título es el enlace, estirado sobre la tarjeta); la casilla y el menú ⋯ quedan por encima y no navegan. Ya no hay edición del título en línea: el título se edita en «Editar detalles».

### Tarjeta de pendiente
Rectángulo con borde 1 px #E1E6E3 (atrasado y abierto: #E8B4AE), radio 14, `overflow: hidden`, alto mínimo 132.
- **Banda izquierda** de 6 px con el color del proyecto (sin proyecto: #C9D0CC). Es decorativa: el nombre del proyecto siempre aparece en texto.
- Contenido con relleno 14 × 16 y separación 10:
  1. **Casilla + título + prioridad.** Casilla de 22 px, borde 2 px #7F8A84, radio 6 (marcada: fondo y borde #007A3D con check blanco). Título 15/20 peso 700, sin límite de líneas (la tarjeta crece). Si es de prioridad alta y está abierta: etiqueta "Alta" con bandera (11/800, texto #B42318, fondo #FDECEA, radio 6).
  2. **Chip de proyecto** (alineado a la izquierda): fondo #EEF2F0, radio 6, relleno 4 × 10, 12/700, punto de 9 px con el color del proyecto y nombre con elipsis. Sin proyecto: borde punteado 1 px #9AA49F, fondo blanco, texto #58635D, "Sin proyecto".
  3. **Pie** (borde superior #EEF2F0, relleno superior 10, `margin-top: auto`): avatar de 28 px con iniciales; a su lado "Pidió" (11/600 muted) y el nombre (13/700, elipsis); a la derecha el **chip de fecha** (12/700, relleno 3 × 8, radio 6, sin salto de línea).
- **Hecha:** título tachado y en gris (`muted`), sin atenuar la tarjeta para mantener contraste AA; la etiqueta "Alta" se oculta.

**Chip de fecha**
| Caso | Texto | Fondo / texto |
|---|---|---|
| Atrasado | "Ayer 17/11 · 1 día tarde", "Mar 17/11 · 2 días tarde" | #FDECEA / #B42318 |
| Hoy | "Hoy" | #FDF0E3 / #8A4A0B |
| Mañana | "Mañana" | #EEF2F0 / #58635D |
| Esta semana y después | "Vie 20/11", "Lun 23/11" | #EEF2F0 / #58635D |
| Sin fecha | "Sin fecha" | #EEF2F0 / #58635D |

Días abreviados: Lun, Mar, Mié, Jue, Vie, Sáb, Dom.

**Avatar:** círculo de 28 px, iniciales 11/800 (dos letras: primera del nombre y primera del apellido). "Yo" usa fondo #022C17, texto blanco y las iniciales del dueño (de `user_settings.display_name`). Los demás toman un par de color según una suma de los caracteres del nombre módulo 5: `#E6F0FB/#1D4F91`, `#FDF0E3/#8A4A0B`, `#E4F5EB/#00652F`, `#EEF2F0/#17201B`, `#FDECEA/#B42318`.

**Color de proyecto:** paleta fija de 8 colores asignada por una suma de los caracteres del `id` del proyecto módulo 8: `#00A859, #D9822B, #2F6FC4, #04512A, #5FD597, #9AA49F, #1D4F91, #8A4A0B`. El mismo proyecto siempre tiene el mismo color en toda la app.

### Panel lateral (retirado)
Se retiraron las tarjetas «Avance de hoy», «Quién los pidió» y «Por proyecto». Sus filtros por solicitante y por proyecto pasaron a los selectores «Pidió» y «Proyecto» (con `aria-label` propio) bajo las pastillas de día.

### Estados
- **Vacío total:** tarjeta con borde punteado 2 px #B5D8C4: "Aún no tienes pendientes" y "Escribe el primero arriba."
- **Vacío por filtro:** misma tarjeta: "No hay pendientes aquí" y "Cambia el filtro o agrega uno nuevo arriba."
- **Cargando:** esqueletos con la forma de las tarjetas.
- **Error:** mensaje en línea #B42318 con "Reintentar"; si falla guardar un cambio, se revierte la actualización optimista y sale un toast.

### Interacciones no prototipadas (usar los mismos componentes)
- **Editar:** clic en el título abre edición en línea; el resto de los campos con un popover igual al compositor.
- **Eliminar:** menú "⋯" visible al pasar el cursor y con foco. Elimina de inmediato y muestra un toast con "Deshacer" durante 5 s.
- Atajo de teclado para enfocar el compositor: `N` (si no hay otro campo con foco).

### Accesibilidad
- Casilla: `button` con `role="checkbox"`, `aria-checked` y `aria-label` igual al título.
- Cada sección es una `section` con `aria-label` del título.
- Selectores de filtro: `aria-label` «Pidió, filtrar pendientes» y «Proyecto, filtrar pendientes». Interruptor de prioridad: `aria-pressed`.
- El color del proyecto nunca es el único indicador: siempre va el nombre. Estados con texto además de color. Foco visible de 2 px #007A3D.

## Reglas de negocio
`hoy` = fecha actual en `America/Bogota`.

**Sección de un pendiente** (según `due_date`):
| Condición | Sección |
|---|---|
| Sin fecha | Sin fecha |
| Fecha menor que hoy y abierto | Atrasados |
| Fecha = hoy | Hoy |
| Fecha = hoy + 1 | Mañana |
| Fecha posterior a mañana y hasta el domingo de esta semana | Esta semana |
| Desde el lunes siguiente | Próxima semana |

**Pendientes hechos:**
- En las secciones del día aparecen los completados hoy (`done_at` es de hoy en Bogotá) o con fecha de hoy o posterior. Los hechos de días anteriores **no se borran nunca**: van a la sección plegable **Hechos anteriores** (al final, con «Todos» y respetando los demás filtros), del más reciente al más antiguo.
- Un hecho con fecha anterior a hoy se muestra en la sección **Hoy**, no en Atrasados.
- Dentro de una sección: primero los abiertos, luego los hechos. Entre abiertos: prioridad alta primero y luego el más reciente primero.

**Fecha "Esta semana" del compositor:** el viernes de la semana actual. Si hoy es viernes, sábado o domingo, el viernes siguiente.

**Avance de hoy:** (retirado de la pantalla; `progressToday` sigue en el dominio con sus pruebas por si vuelve a usarse).

**Pastillas:** Hoy = atrasados + hoy; Próximos = esta semana + próxima semana. Los contadores cuentan abiertos y no dependen de los otros filtros.

**Filtros por solicitante y proyecto:** selectores con todas las personas y proyectos conocidos; filtran las tarjetas visibles.

**Marcar o desmarcar:** actualización optimista inmediata; se guarda con una Server Action.

## Datos

Migración `supabase/migrations/0002_pendientes.sql` (usa `public.task_priority` y `public.set_updated_at()` de `0001_init.sql`):

```sql
-- 0002 · Pendientes (tareas sueltas del día)
create table public.quick_tasks (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  project_id   uuid references public.projects(id) on delete set null,
  requested_by text not null default 'Yo' check (char_length(requested_by) between 1 and 80),
  due_date     date,                                    -- null = sin fecha
  priority     public.task_priority not null default 'medium',  -- la UI usa solo high y medium
  done         boolean not null default false,
  done_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index quick_tasks_owner_idx     on public.quick_tasks (owner_id, done, due_date);
create index quick_tasks_project_idx   on public.quick_tasks (project_id);
create index quick_tasks_requester_idx on public.quick_tasks (owner_id, requested_by);

create or replace function public.set_quick_task_done_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.done then
      new.done_at := now();
    end if;
  elsif new.done and not old.done then
    new.done_at := now();
  elsif not new.done then
    new.done_at := null;
  end if;
  return new;
end $$;

create trigger quick_tasks_done_at before insert or update on public.quick_tasks
  for each row execute function public.set_quick_task_done_at();
create trigger quick_tasks_updated before update on public.quick_tasks
  for each row execute function public.set_updated_at();

alter table public.quick_tasks enable row level security;
create policy "owner full access" on public.quick_tasks for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
```

- `requested_by` es texto libre. "Yo" significa el dueño. El autocompletado sale de los valores distintos ya usados:
  `select distinct requested_by from quick_tasks where owner_id = auth.uid()`.
- Al eliminar un proyecto, sus pendientes quedan sin proyecto (`on delete set null`).
- Consulta de la pantalla: todos los pendientes (abiertos y hechos, sin filtrar por fecha), con el proyecto, las etiquetas y el conteo de secciones y notas.
- `created_at` es la fecha de creación: la pone la base de datos y **no se puede editar** (un disparador conserva el valor original en cualquier UPDATE). Se muestra en la tarjeta («Creado dd/MM/yyyy») y en el panel de detalle.

### Server Actions (validar con Zod)
`createQuickTask`, `toggleQuickTask`, `updateQuickTask`, `deleteQuickTask`.

### Dominio (`src/lib/domain/pendientes.ts`, funciones puras con tests)
`getSection`, `dueLabel`, `fridayOfWeek`, `groupBySection`, `sortInSection`, `progressToday`, `visibleDone`, `personColor`, `projectColor`, `initials`.

**Casos mínimos de prueba:** atrasado (1 y 2 días); hoy; mañana; jueves → "Esta semana" = viernes; viernes, sábado y domingo → "Esta semana" = viernes siguiente; sábado con tarea para el domingo (Esta semana); lunes siguiente (Próxima semana); sin fecha; hecho con fecha pasada (va a Hoy); hecho ayer (oculto); orden (abiertos antes que hechos, alta antes que normal, más reciente primero); avance de hoy; iniciales de "Laura P." y "Yo".

## Datos de ejemplo (para `scripts/seed.ts`)
Genéricos, sin nombres de empresas reales. Solicitantes: Yo, Laura P., Andrés R., Camilo V., Diana S., Jorge T. Proyectos: los 5 de la semilla existente. **17 pendientes** con esta distribución respecto de la fecha de hoy:
- 2 atrasados (uno con prioridad alta),
- 7 para hoy (2 ya hechos, 2 con prioridad alta),
- 3 para mañana,
- 2 para el viernes,
- 1 para el lunes siguiente,
- 2 sin fecha,
- 3 de ellos sin proyecto (por ejemplo, "Renovar el certificado del servidor de pruebas").

## Hito M3b · Pendientes
Insertar en `docs/04-plan-de-construccion.md` después de M3.
- Migración `0002`, tipos, Server Actions y funciones de dominio con tests.
- Pantalla `/pendientes` completa: compositor, pastillas, secciones, tarjetas a todo el ancho y filtros.
- Edición en línea, eliminar con "Deshacer", estados vacío, cargando y error.
- Ajuste de la barra superior y de la búsqueda global.

**Listo cuando:** escribir un pendiente y presionar Enter lo muestra en su sección al instante; marcarlo lo tacha sin recargar y un clic en la tarjeta lo abre; filtrar por una persona o por un proyecto deja solo sus tarjetas; todos los casos de prueba de dominio pasan; y la pantalla coincide con este documento.
