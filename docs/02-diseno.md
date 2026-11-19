# 02 · Diseño

Interfaz clara y 100% responsive (desde 320 px hasta monitores grandes), con una barra superior verde oscura y contenido sobre fondo gris muy claro. **Sin barra lateral.** Tokens exactos en `design/tokens.json`.

## Principios
1. **Visual primero.** El estado se ve en color, forma y barras, y además siempre hay texto.
2. **Densidad cómoda.** Tarjetas y tablas con aire; nada decorativo.
3. **Una acción principal por pantalla**, en verde primario.
4. **Fechas siempre visibles** y en el mismo formato: `dd/MM/yyyy`.
5. **Responsive mobile-first, sin ancho mínimo.** Debe usarse y verse bien en cualquier pantalla y resolución, incluido el celular. Sin desborde horizontal de la página. Las medidas de abajo describen el escritorio; en pantallas menores se adaptan así:
   - **Márgenes:** 16 px en móvil, 32 px desde 640 px. Contenido centrado con ancho máximo de 1376 px.
   - **Barra superior:** en móvil solo logo y avatar; "Mis tareas" y "Calendario" desde 768 px, buscador desde 1024 px, campana desde 640 px.
   - **Cuadrículas de proyectos:** 1 columna en móvil, 2 desde 768 px, 3 desde 1280 px. Indicadores: 2×2 en móvil, 4 en fila desde 1024 px.
   - **Cabecera de proyecto:** título, botones y datos se apilan; las pestañas se desplazan horizontalmente.
   - **Resumen:** las tarjetas de fase se desplazan horizontalmente con ajuste (snap); las dos columnas pasan a una bajo 1100 px.
   - **Fases y tareas:** bajo 1024 px cada tarea es una tarjeta (título, botón de estado de 40 px, prioridad, fecha, horas); desde 1024 px, la tabla.
   - **Diálogos:** centrados con márgenes en móvil, con pie fijo en el asistente de registro; el panel de detalle ocupa todo el ancho.
   - **Formularios:** campos de 16 px en móvil (evita el zoom automático de iOS); columnas dobles pasan a una.

## Tipografía
Plus Jakarta Sans (Google Fonts), pesos 400, 500, 600, 700, 800. Números con `font-variant-numeric: tabular-nums`.

| Uso | Tamaño / interlineado | Peso |
|---|---|---|
| Saludo de Inicio | 30 / 38, tracking -0.02em | 800 |
| Título de proyecto | 24 / 30, tracking -0.015em | 800 |
| Título de sección | 16–18 | 800 |
| Título de tarjeta | 15–17 / 20–22 | 700–800 |
| Texto | 14 | 400–600 |
| Etiqueta (label) | 12 | 500, color muted |
| Chip, estado | 12 | 600–700 |

## Colores
| Token | Hex | Uso |
|---|---|---|
| green-900 | #022C17 | Barra superior, botón activo de filtro |
| green-800 | #04512A | Buscador sobre la barra, estado Entregado |
| green-700 | #007A3D | Botón primario, enlaces, fase hecha |
| green-700-hover | #00652F | Hover del primario |
| green-500 | #00A859 | Marca, barras de progreso, estado Prod |
| green-300 | #5FD597 | Acento sobre fondo oscuro (pestaña activa, badge de la campana) |
| green-200 | #B5D8C4 | Texto secundario sobre verde oscuro |
| green-100 | #C8ECD7 | Contornos suaves |
| green-50 | #E4F5EB | Fondos suaves (íconos, chips activos) |
| bg | #F6F8F7 | Fondo de página |
| surface | #EEF2F0 | Pistas de barra, chips |
| border | #E1E6E3 | Bordes de tarjeta y filas |
| text / muted | #17201B / #58635D | Texto / texto secundario |
| input-border | #7F8A84 | Bordes de campos y botón secundario |

Colores de estado, tarea, prioridad, salud, tipo de recurso y tipo de cambio: ver `design/tokens.json`.

## Forma y espacio
- Radios: tarjeta 14, diálogo 20, botón 10, campo 8, etiqueta de estado 6, pastilla 999.
- Contenido centrado, ancho máximo 1376 px, relleno de página 28 × 32 px.
- Separación entre bloques 16–22 px. Relleno de tarjeta 16–20 px.
- Sombra solo en hover de tarjeta de proyecto y en diálogos.

## Componentes

**TopBar.** Alto 56, fondo #022C17, relleno horizontal 32.
- Logo: rombo de 16 px #00A859 girado 45° (radio 3) + "hito" 16/800 blanco.
- Enlaces (Proyectos, Mis tareas, Calendario): 14/500 #B5D8C4. Activo: blanco 600 con borde inferior de 2 px #5FD597. Separación 24.
- Buscador a la derecha: 300 × 36, fondo #04512A, texto blanco, placeholder "Buscar proyectos, tareas o recursos".
- Campana 36 × 36 con badge (#5FD597, texto #022C17, 10/800). Avatar 32 px circular #007A3D con iniciales.

**StatusLabel.** Rectángulo radio 6, 12/700, relleno 4 × 10. Colores por estado según tokens.

**Button.** Alto 38, radio 10, 14/600, ícono opcional a 8 px.
- Primario: fondo #007A3D, hover #00652F, texto blanco.
- Secundario: fondo blanco, borde 1 px #7F8A84, texto #17201B.
- Texto: sin fondo, #58635D.

**FilterPill.** Radio 999, borde #E1E6E3, relleno 7 × 14, 13/600, contador a 75 % de opacidad. Activo: fondo #022C17, texto blanco.

**Chip.** Pastilla 12/600, relleno 4 × 10, fondo #EEF2F0, texto #3C4741, ícono de 13 px.

**Bar.** Alto 6, fondo #EEF2F0, relleno #00A859, radio 999.

**PhaseSegments.** Fila con separación 3; un segmento por fase, alto 10, radio 3.
- Hecha #00A859. Actual #D9822B (atrasada #B42318, detenida #9AA49F). Futura #E1E6E3.
- Cada segmento tiene `title` con el nombre de la fase.

**Card.** Fondo blanco, borde 1 px #E1E6E3, radio 14. La tarjeta de proyecto, en hover: borde #7F8A84 y sombra.

**TaskStateCell.** Botón de celda completa, alto 36, radio 6, 12/700. Clic cambia al siguiente estado. `aria-label`: "{tarea}: {estado}. Cambiar estado".

**Íconos.** lucide-react, trazo 1.9, 18 px (13 px dentro de chips): workflow, file-text, link, code, calendar, pin, user, key, plus, bell, search, chevron-right.

## Pantallas

### 1 · Inicio `/`
Barra superior, luego un `main` con separación de 22 px.

1. **Encabezado.** Fecha ("Miércoles, 18/11/2026", 14 muted). Debajo, "Buenos días, {nombre}" (antes de 12:00 "Buenos días", hasta 19:00 "Buenas tardes", luego "Buenas noches"). Botón primario "Registrar proyecto" a la derecha.
2. **Indicadores.** 4 tarjetas en fila. Cada una: ícono de 44 px (radio 12) + número 26/800 + etiqueta 12 muted.
   - "proyectos activos de {total}" (activos = no entregados): ícono workflow, fondo #E4F5EB, trazo #007A3D.
   - "fases terminan esta semana": calendar, #FDF0E3 / #8A4A0B.
   - "tareas abiertas": note, #E6F0FB / #1D4F91.
   - "fase atrasada" (plural si hay más): pin, #FDECEA / #B42318; número en rojo.
3. **Filtros.** Pastillas: Todos, Desarrollo, QA, Prod, En espera, Entregados, cada una con su cantidad. A la derecha: "Ordenados por entrega más cercana".
4. **Cuadrícula de proyectos.** 3 columnas, separación 18. Al final, una tarjeta con borde punteado de 2 px #B5D8C4: círculo con "+" y el texto "Registrar proyecto".

**Tarjeta de proyecto** (enlace a `/proyectos/[id]`, relleno 18 × 20, separación 14):
- Fila 1: área (12/600 muted) y nombre (17/22 800) a la izquierda; StatusLabel a la derecha.
- Fase: "Fase actual: {nombre}" (12/700) y "Fase i de n" (12 muted, a la derecha); debajo PhaseSegments; debajo el texto de la fecha de fase (12/600):
  - normal: "{fase} termina el dd/MM"
  - en riesgo: mismo texto en #8A4A0B
  - atrasada: "{fase} debía terminar el dd/MM · N días tarde" en #B42318
  - detenida: "Detenido en {fase}"
  - entregada: "Proyecto entregado" y "Cerrado el dd/MM/yyyy"
- Borde superior #EEF2F0, 2 columnas: **Tareas** (barra + "x/y") y **Entrega final** ("dd/MM/yyyy · En N días", el texto de días con el color de la regla).
- Fila de chips: documentos, flujos y código, enlaces (cada uno con ícono y número) y "Actualizado {relativo}" a la derecha.

Estado vacío (sin proyectos): solo la tarjeta punteada, con "Aún no tienes proyectos. Registra el primero."

### 2 · Proyecto: Resumen `/proyectos/[id]`

**Cabecera** (fondo blanco, borde inferior #E1E6E3, relleno 18 × 32):
- Ruta: "Proyectos / {nombre}" (13 muted, "Proyectos" es enlace).
- Fila: ícono de 44 px (radio 12, fondo #E4F5EB) + título 24/800 + descripción 13 muted + StatusLabel. A la derecha: botones "Cambiar estado" (secundario) y "Editar proyecto" (primario).
- Datos en fila, separación 36 (label 12 muted + valor 14/600): Fase actual ("QA · 4 de 6"), Fin de fase estimado, Entrega final estimada ("20/11/2026 · en 2 días", con el color de la regla), Responsable, y Avance ("Avance · 10 de 17 tareas" con barra de 200 px).
- Pestañas: **Resumen**, **Fases y tareas** (con contador), **Recursos** (con contador), **Notas**, **Historial**. Activa: 700 con subrayado de 2 px #007A3D. Separación 28.

**Cuerpo** (relleno 24 × 32, separación 22):

a) **Fases y entregas estimadas.** Título 18/800 y enlace "Ver fases y tareas". Lista en cuadrícula de hasta 6 columnas (si hay más, desplazamiento horizontal). Cada tarjeta de fase (relleno 14 × 16, separación 8):
- Círculo numerado de 24 px: hecha #007A3D con texto blanco; actual #D9822B con texto #17201B; futura #EEF2F0 con texto #58635D. Junto al círculo, nombre 14/800.
- "Entrega estimada" (label) y la fecha 18/800.
- Nota de fase (12/600, ver reglas en `01-producto.md`).
- Barra de tareas + "x/y".
- La fase actual lleva borde de 2 px #D9822B y fondo #FFFAF4.

b) Dos columnas.
- **Izquierda (ancha, mínimo 600 px). Tarjeta "Tareas de la fase actual":** título 16/800, StatusLabel del proyecto, "estimada al dd/MM" y enlace "Ver todas". Filas con borde superior #EEF2F0 y relleno 12: celda de estado (ancho 92) + título 14/600 + horas ("4 h") + fecha (en #8A4A0B y 700 si es hoy o mañana). Debajo, aviso ámbar (fondo #FDF0E3, texto #8A4A0B 13/600, radio 10) cuando estimada ≠ original: "La fase {X} va {N} días corrida respecto al plan inicial ({dd/MM}). La entrega final sigue estimada para el {dd/MM}." (o "pasa a estar estimada").
- **Derecha (mínimo 360 px).** Tarjeta "Recursos fijados" (hasta 4, con enlace "Ver los N"): filas con ícono de 36 px, nombre 14/600, origen 12 muted e ícono de enlace. Tarjeta "Próximas alertas" (las 3 siguientes): fecha y hora (12/800, ancho 86) + texto.

### 3 · Proyecto: Fases y tareas `/proyectos/[id]/fases`
Misma cabecera con la pestaña "Fases y tareas" activa.

- **Barra de herramientas:** "Nueva tarea" (primario con +), "Nueva fase" (secundario con +), la ayuda "Toca el estado de una tarea para cambiarlo. Toca el nombre de una fase para plegarla." y, a la derecha, la leyenda de 4 estados (cuadrito de 12 px + texto).
- **Grupo de fase** (tarjeta con overflow oculto). Una por fase:
  - Encabezado (relleno 14 × 18, fondo #FFFAF4 si es la actual): botón que pliega, con chevron (gira 90° al abrir), círculo numerado de 26 px (todas hechas #007A3D, actual #D9822B, futura #9AA49F) y nombre 16/800. Chip blanco con borde "Entrega estimada dd/MM/yyyy" (clic abre selector de fecha y motivo). Nota de fase (12/700). A la derecha: barra de distribución de 10 px con segmentos proporcionales (hechas #007A3D, en curso #D9822B, bloqueadas #B42318, pendientes #C9D0CC; separación 2) y "x/y".
  - Abiertas por defecto: la fase actual y la siguiente.
  - Tabla (mínimo 900 px). Columnas: Tarea, Estado (140), Prioridad (120), Fecha (110), Estimado (100, derecha), Recursos (120, con ícono de enlace y "N recursos"). Encabezados 11 mayúsculas con tracking .06em. Filas de alto 36 + relleno.
  - Última fila: "+ Agregar tarea a {fase}" (texto verde 13/700) que abre un campo en línea.
- **Detalle de tarea** (no prototipado): panel lateral derecho de 480 px con título, descripción, estado, prioridad, fecha, horas, motivo de bloqueo (solo si está bloqueada) y recursos vinculados. Usar los mismos componentes.
- Estado vacío de fase: "Esta fase no tiene tareas. Agrega la primera."

### 4 · Proyecto: Recursos `/proyectos/[id]/recursos`
Dos columnas: principal (mínimo 720 px) y lateral (340 px).

**Principal**
- Pastillas de filtro: Todos, Documentos, Flujos y código, Enlaces (con cantidad). Botón primario "Agregar recurso" a la derecha.
- Cuadrícula de 3 columnas (separación 14) de **tarjetas de recurso** (relleno 16, separación 12):
  - Cabecera: ícono de 42 px (radio 12) con colores del tipo; categoría 12/700 (mismo color) y origen 12 muted; ícono de pin #007A3D si está fijado.
  - Nombre 15/20 700.
  - Pie con borde superior: chip de fase (11) y fecha a la derecha.
  - Clic abre el enlace en pestaña nueva (`rel="noopener noreferrer"`). Menú "⋯": editar, fijar, eliminar.
- **Zona de carga**: borde punteado de 2 px #B5D8C4, radio 14, relleno 22, fondo blanco. Título "Arrastra un archivo o pega un enlace" y texto "Detecto el tipo solo: SharePoint, Power Automate, GitHub, Figma o cualquier URL."

**Lateral**
- Tarjeta **Notas del proyecto** (título 16/800 + botón "Editar"): lista con viñetas 14/22.
- Tarjeta **Contactos**: avatar de 36 px + nombre 14/600 + rol 12 muted.
- Caja informativa (fondo #E4F5EB, radio 14, texto #04512A 13/20) con ícono key: "Accesos: aquí solo registras dónde está cada credencial (por ejemplo, tu gestor de contraseñas). La app nunca guarda contraseñas."

### 5 · Registrar proyecto (diálogo) `/proyectos/nuevo`
Se abre sobre Inicio con velo `rgba(2,44,23,.55)`. Diálogo de ancho máximo 820, radio 20, sombra de diálogo, centrado arriba con 40 px de margen.

- **Cabecera:** "Registrar proyecto" (22/800), subtítulo con "{nombre} · {área}" en vivo, botón cerrar.
- **Pasos:** 3 columnas. Cada una tiene una barra de 4 px (hecho o actual #007A3D, pendiente #E1E6E3) y una etiqueta 13: "1 · Datos generales", "2 · Fases y fechas estimadas", "3 · Recursos". Actual 800, hecho #00652F 600, pendiente muted.
- **Paso 1:** Nombre (obligatorio), Área, Descripción, Responsable, Fecha de inicio.
- **Paso 2:**
  - "Empieza con una plantilla": 3 botones (nombre + "N fases"). Seleccionado: borde 2 px #007A3D, fondo #E4F5EB. Al elegir, las fechas se calculan desde la fecha de inicio.
  - Filas con columnas 32 / 1fr / 180 / 36: círculo numerado de 28 px (#E4F5EB, texto #00652F), campo de nombre, campo de fecha, botón "×" para quitar.
  - Botón punteado "+ Agregar fase".
  - Resumen (fondo #F6F8F7, radio 12, relleno 12 × 16): ícono calendar + "Entrega final estimada: dd/MM/yyyy · N fases" y casilla "Avisarme 2 días antes de cada fase" (marcada).
- **Paso 3:** pegar enlaces o subir archivos (opcional).
- **Pie** (borde superior): "Atrás" (secundario), "Cancelar" (texto, empuja a la derecha) y "Siguiente: …" o "Crear proyecto" (primario).
- Validación: nombre obligatorio; al menos 1 fase; avisar (sin bloquear) si las fechas no van en orden.

### 6 · Proyecto: Historial `/proyectos/[id]/historial` (sin prototipo)
Misma cabecera con "Historial" activa. Dos columnas.
- **Izquierda, "Historial de cambios":** tabla con Fecha, Tipo (etiqueta pastilla con colores `change_kind`), Cambio (valor anterior tachado en gris → valor nuevo en negrita) y Motivo ("—" si no hay). Filtro "Tipo: todos".
- **Derecha:**
  - **Reglas de alerta:** una fila por regla (nombre 14/600 y descripción 12 muted) con interruptor (`role="switch"`, `aria-checked`, 40 × 22, activo #007A3D, inactivo #9AA49F).
  - **Dónde recibirlas:** "Dentro de la app", "Correo", "Microsoft Teams" (este último deshabilitado, "Próximamente").

### Elementos globales sin prototipo
- **Campana:** menú desplegable con notificaciones no leídas y "Marcar todas como leídas".
- **Cambiar estado:** diálogo pequeño con selector de estado y nota opcional.
- **Login:** tarjeta centrada de 400 px sobre fondo #F6F8F7 con logo, correo y botón primario.
- **Toasts:** esquina inferior derecha, para confirmaciones y errores.

## Estados
- **Cargando:** esqueletos con la misma forma (tarjetas, filas) en #EEF2F0. Sin spinners de pantalla completa.
- **Vacío:** mensaje corto y una acción.
- **Error:** mensaje en línea en #B42318 con opción de reintentar.
- **Foco:** anillo de 2 px #007A3D con separación de 2 px.
- **Movimiento:** transiciones de 120 ms ease-out (hover, chevron). Respetar `prefers-reduced-motion`.

## Datos de ejemplo para desarrollo
Usar datos genéricos (sin nombres de empresas reales): 5 proyectos como "Agente de atención por WhatsApp" (QA, fase actual QA, 10/17 tareas, entrega en 2 días), "Automatización de cartera" (Prod, atrasada 2 días), "Registro de incapacidades" (Desarrollo), "Portal de clientes" (Desarrollo), "Inventario de equipos" (Entregado), con 5 o 6 fases cada uno, 6–17 tareas y 3–9 recursos. Se carga con un script `scripts/seed.ts` que usa la llave de servicio y el correo del dueño.
