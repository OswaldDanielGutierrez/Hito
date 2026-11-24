/** Etiquetas de proyectos y pendientes (ej.: Power Apps, Power Automate). Lógica pura. */

export const TAG_COLORS = ["green", "blue", "amber", "red", "purple", "teal", "pink", "gray"] as const;
export type TagColor = (typeof TAG_COLORS)[number];

export const MAX_TAG_NAME = 30;

export const TAG_COLOR_LABELS: Record<TagColor, string> = {
  green: "Verde",
  blue: "Azul",
  amber: "Ámbar",
  red: "Rojo",
  purple: "Morado",
  teal: "Turquesa",
  pink: "Rosa",
  gray: "Gris",
};

/** `bg` y `ink` cumplen contraste AA entre sí; `dot` es el color de acento (puntos y muestras). */
export const TAG_STYLES: Record<TagColor, { bg: string; ink: string; dot: string }> = {
  green: { bg: "#E3F4EA", ink: "#00652F", dot: "#00A859" },
  blue: { bg: "#E5EEFB", ink: "#1F4FA3", dot: "#3B7DDD" },
  amber: { bg: "#FDF0E3", ink: "#8A4A0B", dot: "#E08A1E" },
  red: { bg: "#FDECEA", ink: "#B42318", dot: "#D92D20" },
  purple: { bg: "#EFE8FA", ink: "#5B34A5", dot: "#7A4FD6" },
  teal: { bg: "#DFF3F1", ink: "#0B6B63", dot: "#14A39A" },
  pink: { bg: "#FBE8F1", ink: "#A3205F", dot: "#D6336C" },
  gray: { bg: "#EEF2F0", ink: "#58635D", dot: "#8A948E" },
};

export interface Tag {
  id: string;
  name: string;
  color: TagColor;
}

export interface TagWithUsage extends Tag {
  projects: number;
  quickTasks: number;
}

export const isTagColor = (value: string): value is TagColor => (TAG_COLORS as readonly string[]).includes(value);

/** Convierte el color guardado en la base; si no es válido, usa gris. */
export const toTagColor = (value: string): TagColor => (isTagColor(value) ? value : "gray");

/** Quita espacios sobrantes (inicio, fin y repetidos). */
export function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Clave para comparar nombres: sin mayúsculas, tildes ni espacios sobrantes. */
export function tagKey(name: string): string {
  return normalizeTagName(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Etiqueta existente con el mismo nombre (ignorando `ignoreId`, útil al renombrar). */
export function findDuplicate<T extends Pick<Tag, "id" | "name">>(tags: T[], name: string, ignoreId?: string): T | undefined {
  const key = tagKey(name);
  return tags.find((t) => t.id !== ignoreId && tagKey(t.name) === key);
}

/** Valida un nombre. Devuelve el mensaje de error o `null` si es válido. */
export function validateTagName(tags: Pick<Tag, "id" | "name">[], name: string, ignoreId?: string): string | null {
  const clean = normalizeTagName(name);
  if (!clean) return "Escribe el nombre de la etiqueta";
  if (clean.length > MAX_TAG_NAME) return `El nombre admite máximo ${MAX_TAG_NAME} caracteres`;
  if (findDuplicate(tags, clean, ignoreId)) return "Ya existe una etiqueta con ese nombre";
  return null;
}

/** Color sugerido para una etiqueta nueva: el menos usado entre las existentes. */
export function suggestColor(tags: Pick<Tag, "color">[]): TagColor {
  const used = new Map<TagColor, number>(TAG_COLORS.map((c) => [c, 0]));
  for (const t of tags) used.set(t.color, (used.get(t.color) ?? 0) + 1);
  return TAG_COLORS.reduce((best, c) => ((used.get(c) ?? 0) < (used.get(best) ?? 0) ? c : best), TAG_COLORS[0]);
}

export function sortTags<T extends Pick<Tag, "name">>(tags: T[]): T[] {
  return [...tags].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
}

/** Etiquetas (ordenadas por nombre) que corresponden a los ids; ignora ids que ya no existen. */
export function tagsFromIds<T extends Pick<Tag, "id" | "name">>(ids: string[], all: T[]): T[] {
  const wanted = new Set(ids);
  return sortTags(all.filter((t) => wanted.has(t.id)));
}

export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Texto de uso de una etiqueta, para avisar antes de eliminarla. */
export function usageText(t: Pick<TagWithUsage, "projects" | "quickTasks">): string {
  const parts = [t.projects > 0 && plural(t.projects, "proyecto", "proyectos"), t.quickTasks > 0 && plural(t.quickTasks, "pendiente", "pendientes")].filter(
    Boolean,
  );
  return parts.length === 0 ? "No está en uso" : `Está en ${parts.join(" y ")}`;
}
