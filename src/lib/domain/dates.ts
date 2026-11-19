export const TIMEZONE = "America/Bogota";

const DAY_MS = 86_400_000;

const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Fecha de hoy (`yyyy-MM-dd`) en America/Bogota. */
export function todayInBogota(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Días de `from` a `to`. Negativo si `to` es anterior. */
export function diffDays(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** Días que faltan para `date` desde `today`. Negativo si ya pasó. */
export function daysUntil(date: string, today: string): number {
  return diffDays(today, date);
}

export function addDays(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** `yyyy-MM-dd` → `dd/MM/yyyy`. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** `yyyy-MM-dd` → `dd/MM`. */
export function formatDayMonth(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** `En N días`, `Mañana`, `Hoy`, `N días tarde`. */
export function daysText(days: number): string {
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days > 1) return `En ${days} días`;
  return days === -1 ? "1 día tarde" : `${-days} días tarde`;
}

export const DAYS_COLORS = { late: "#B42318", soon: "#8A4A0B", normal: "#58635D" } as const;

/** Atrasado rojo, 3 días o menos ámbar, el resto gris. */
export function daysColor(days: number): string {
  if (days < 0) return DAYS_COLORS.late;
  if (days <= 3) return DAYS_COLORS.soon;
  return DAYS_COLORS.normal;
}

/** Semana actual de lunes a domingo. */
export function weekBounds(today: string): { start: string; end: string } {
  const dayOfWeek = new Date(toUtc(today)).getUTCDay();
  const start = addDays(today, -((dayOfWeek + 6) % 7));
  return { start, end: addDays(start, 6) };
}

export function isInCurrentWeek(date: string, today: string): boolean {
  const { start, end } = weekBounds(today);
  return date >= start && date <= end;
}
