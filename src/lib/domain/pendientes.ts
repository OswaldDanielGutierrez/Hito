import { addDays, diffDays, formatDayMonth, todayInBogota, weekBounds } from "./dates";

export type QuickPriority = "high" | "medium" | "low";

export interface QuickTask {
  id: string;
  title: string;
  projectId: string | null;
  projectName: string | null;
  requestedBy: string;
  dueDate: string | null;
  priority: QuickPriority;
  done: boolean;
  doneAt: string | null;
  createdAt: string;
  tagIds: string[];
  notesCount: number;
  attachmentsCount: number;
  /** Tiene texto en el bloc de escritura libre. */
  hasNotepad: boolean;
}

export type SectionKey = "overdue" | "today" | "tomorrow" | "week" | "nextWeek" | "none";

export interface SectionGroup {
  key: SectionKey;
  label: string;
  range: string | null;
  tasks: QuickTask[];
  openCount: number;
}

export const SECTION_ORDER: SectionKey[] = ["overdue", "today", "tomorrow", "week", "nextWeek", "none"];

const SECTION_LABELS: Record<SectionKey, string> = {
  overdue: "Atrasados",
  today: "Hoy",
  tomorrow: "Mañana",
  week: "Esta semana",
  nextWeek: "Próxima semana",
  none: "Sin fecha",
};

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const weekdayShort = (iso: string) => WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()];

/** `Mié 18/11` */
export function dayLabel(iso: string): string {
  return `${weekdayShort(iso)} ${formatDayMonth(iso)}`;
}

/** Sección donde se muestra un pendiente. Un hecho con fecha pasada va a Hoy, no a Atrasados. */
export function getSection(task: Pick<QuickTask, "dueDate" | "done">, today: string): SectionKey {
  if (!task.dueDate) return "none";
  if (task.dueDate < today) return task.done ? "today" : "overdue";
  if (task.dueDate === today) return "today";
  if (task.dueDate === addDays(today, 1)) return "tomorrow";
  return task.dueDate <= weekBounds(today).end ? "week" : "nextWeek";
}

export interface DueLabel {
  text: string;
  bg: string;
  ink: string;
}

const NEUTRAL = { bg: "#EEF2F0", ink: "#58635D" };

/** Texto y colores del chip de fecha de la tarjeta. */
export function dueLabel(task: Pick<QuickTask, "dueDate" | "done">, today: string): DueLabel {
  if (!task.dueDate) return { text: "Sin fecha", ...NEUTRAL };

  const days = diffDays(today, task.dueDate);
  if (days < 0) {
    if (task.done) return { text: dayLabel(task.dueDate), ...NEUTRAL };
    const late = -days;
    const when = late === 1 ? `Ayer ${formatDayMonth(task.dueDate)}` : dayLabel(task.dueDate);
    return { text: `${when} · ${late} ${late === 1 ? "día" : "días"} tarde`, bg: "#FDECEA", ink: "#B42318" };
  }
  if (days === 0) return { text: "Hoy", bg: "#FDF0E3", ink: "#8A4A0B" };
  if (days === 1) return { text: "Mañana", ...NEUTRAL };
  return { text: dayLabel(task.dueDate), ...NEUTRAL };
}

/**
 * Fecha de "Esta semana" del compositor: el viernes de la semana actual;
 * si hoy es viernes, sábado o domingo, el viernes siguiente.
 */
export function fridayOfWeek(today: string): string {
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 domingo … 6 sábado
  const offset: Record<number, number> = { 1: 4, 2: 3, 3: 2, 4: 1, 5: 7, 6: 6, 0: 5 };
  return addDays(today, offset[dow]);
}

const doneToday = (task: Pick<QuickTask, "done" | "doneAt">, today: string) =>
  task.done && task.doneAt !== null && todayInBogota(new Date(task.doneAt)) === today;

/** Un hecho se ve solo si se completó hoy o su fecha es hoy o posterior. Los abiertos siempre se ven. */
export function visibleDone(task: Pick<QuickTask, "done" | "doneAt" | "dueDate">, today: string): boolean {
  if (!task.done) return true;
  return doneToday(task, today) || (task.dueDate !== null && task.dueDate >= today);
}

/**
 * Hechos de días anteriores: no se ven en las secciones del día pero nunca se pierden.
 * Van a «Hechos anteriores», del más reciente al más antiguo.
 */
export function olderDone(tasks: QuickTask[], today: string): QuickTask[] {
  return tasks
    .filter((t) => t.done && !visibleDone(t, today))
    .sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? "") || b.createdAt.localeCompare(a.createdAt));
}

/** Texto corto con lo que tiene un pendiente (apuntes, notas importantes, adjuntos); vacío si no tiene nada. */
export function detailSummary(t: Pick<QuickTask, "notesCount" | "attachmentsCount" | "hasNotepad">): string {
  const parts = [
    t.hasNotepad && "Apuntes",
    t.notesCount > 0 && `${t.notesCount} ${t.notesCount === 1 ? "nota" : "notas"}`,
    t.attachmentsCount > 0 && `${t.attachmentsCount} ${t.attachmentsCount === 1 ? "adjunto" : "adjuntos"}`,
  ].filter(Boolean);
  return parts.join(" · ");
}

/** ¿Eliminarlo borraría contenido propio (apuntes, notas o adjuntos)? Pide confirmación. */
export function hasContent(t: Pick<QuickTask, "notesCount" | "attachmentsCount" | "hasNotepad">): boolean {
  return t.hasNotepad || t.notesCount > 0 || t.attachmentsCount > 0;
}

/** Abiertos antes que hechos; entre abiertos, prioridad alta primero y luego el más reciente. */
export function sortInSection(tasks: QuickTask[]): QuickTask[] {
  const rank = (t: QuickTask) => (t.priority === "high" ? 0 : 1);
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.done) return (b.doneAt ?? "").localeCompare(a.doneAt ?? "") || b.createdAt.localeCompare(a.createdAt);
    return rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt);
  });
}

function rangeOf(key: SectionKey, today: string): string | null {
  const sunday = weekBounds(today).end;
  switch (key) {
    case "today":
      return dayLabel(today);
    case "tomorrow":
      return dayLabel(addDays(today, 1));
    case "week": {
      const start = addDays(today, 2);
      return start <= sunday ? `${dayLabel(start)} – ${dayLabel(sunday)}` : null;
    }
    case "nextWeek":
      return `Desde ${dayLabel(addDays(sunday, 1))}`;
    default:
      return null;
  }
}

/** Las 6 secciones en orden (las vacías incluidas), solo con los pendientes visibles y ordenados. */
export function groupBySection(tasks: QuickTask[], today: string): SectionGroup[] {
  const visible = tasks.filter((t) => visibleDone(t, today));
  return SECTION_ORDER.map((key) => {
    const inSection = sortInSection(visible.filter((t) => getSection(t, today) === key));
    return {
      key,
      label: SECTION_LABELS[key],
      range: rangeOf(key, today),
      tasks: inSection,
      openCount: inSection.filter((t) => !t.done).length,
    };
  });
}

export type DayFilter = "all" | "today" | "tomorrow" | "upcoming" | "none";

const DAY_FILTER_SECTIONS: Record<DayFilter, SectionKey[]> = {
  all: SECTION_ORDER,
  today: ["overdue", "today"],
  tomorrow: ["tomorrow"],
  upcoming: ["week", "nextWeek"],
  none: ["none"],
};

export function matchesDayFilter(section: SectionKey, filter: DayFilter): boolean {
  return DAY_FILTER_SECTIONS[filter].includes(section);
}

/** Contadores de las pastillas: solo abiertos y sin depender de los demás filtros. */
export function dayCounts(tasks: QuickTask[], today: string): Record<DayFilter, number> {
  const open = tasks.filter((t) => !t.done);
  const count = (filter: DayFilter) => open.filter((t) => matchesDayFilter(getSection(t, today), filter)).length;
  return { all: open.length, today: count("today"), tomorrow: count("tomorrow"), upcoming: count("upcoming"), none: count("none") };
}

export interface DayProgress {
  done: number;
  total: number;
  remaining: number;
  cells: ("done" | "overdue" | "open")[];
}

/** Avance de hoy: abiertos atrasados o de hoy + hechos hoy. Los hechos van primero. */
export function progressToday(tasks: QuickTask[], today: string): DayProgress {
  const done = tasks.filter((t) => doneToday(t, today));
  const overdue = tasks.filter((t) => !t.done && t.dueDate !== null && t.dueDate < today);
  const dueToday = tasks.filter((t) => !t.done && t.dueDate === today);
  return {
    done: done.length,
    total: done.length + overdue.length + dueToday.length,
    remaining: overdue.length + dueToday.length,
    cells: [...done.map(() => "done" as const), ...overdue.map(() => "overdue" as const), ...dueToday.map(() => "open" as const)],
  };
}

export interface Tally {
  key: string;
  label: string;
  count: number;
}

export const NO_PROJECT_KEY = "__sin_proyecto__";

function tally(tasks: QuickTask[], keyOf: (t: QuickTask) => { key: string; label: string }): Tally[] {
  const map = new Map<string, Tally>();
  for (const t of tasks.filter((x) => !x.done)) {
    const { key, label } = keyOf(t);
    map.set(key, { key, label, count: (map.get(key)?.count ?? 0) + 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"));
}

/** Abiertos por solicitante, de mayor a menor. */
export const tallyByRequester = (tasks: QuickTask[]) => tally(tasks, (t) => ({ key: t.requestedBy, label: t.requestedBy }));

/** Abiertos por proyecto (incluye "Sin proyecto"), de mayor a menor. */
export const tallyByProject = (tasks: QuickTask[]) =>
  tally(tasks, (t) => ({ key: t.projectId ?? NO_PROJECT_KEY, label: t.projectName ?? "Sin proyecto" }));

const charSum = (text: string) => [...text].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

const PERSON_PALETTE = [
  { bg: "#E6F0FB", ink: "#1D4F91" },
  { bg: "#FDF0E3", ink: "#8A4A0B" },
  { bg: "#E4F5EB", ink: "#00652F" },
  { bg: "#EEF2F0", ink: "#17201B" },
  { bg: "#FDECEA", ink: "#B42318" },
];

export const SELF_NAME = "Yo";

/** "Yo" usa fondo oscuro; los demás, un par de color según la suma de los caracteres del nombre. */
export function personColor(name: string): { bg: string; ink: string } {
  if (name === SELF_NAME) return { bg: "#022C17", ink: "#FFFFFF" };
  return PERSON_PALETTE[charSum(name) % PERSON_PALETTE.length];
}

const PROJECT_PALETTE = ["#00A859", "#D9822B", "#2F6FC4", "#04512A", "#5FD597", "#9AA49F", "#1D4F91", "#8A4A0B"];

/** El mismo proyecto siempre tiene el mismo color en toda la app. */
export function projectColor(projectId: string): string {
  return PROJECT_PALETTE[charSum(projectId) % PROJECT_PALETTE.length];
}

export const NO_PROJECT_COLOR = "#C9D0CC";

/** Primera letra del nombre y de la segunda palabra; con una sola palabra, sus dos primeras letras. */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  if (words.length === 0) return "?";
  const letter = (w: string) => w.match(/[\p{L}\p{N}]/u)![0];
  if (words.length === 1) return [...words[0]].filter((c) => /[\p{L}\p{N}]/u.test(c)).slice(0, 2).join("").toUpperCase();
  return (letter(words[0]) + letter(words[1])).toUpperCase();
}

/** Avatar de quien pidió el pendiente. "Yo" muestra las iniciales del dueño. */
export function requesterAvatar(requestedBy: string, ownerName: string): { initials: string; bg: string; ink: string } {
  const label = requestedBy === SELF_NAME ? ownerName || SELF_NAME : requestedBy;
  return { initials: initials(label), ...personColor(requestedBy) };
}
