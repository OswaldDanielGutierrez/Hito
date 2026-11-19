import { addDays } from "./dates";

export interface TemplatePhase {
  name: string;
  offset_days: number;
}

export interface PlannedPhase {
  name: string;
  date: string;
}

/** Fecha de cada fase = fecha de inicio + `offset_days` de la plantilla. */
export function calculatePhaseDates(startDate: string, phases: TemplatePhase[]): PlannedPhase[] {
  return phases.map((p) => ({ name: p.name, date: addDays(startDate, p.offset_days) }));
}

/** True si alguna fecha es anterior a la de la fase previa (se avisa, no se bloquea). */
export function hasDatesOutOfOrder(dates: (string | null)[]): boolean {
  let previous: string | null = null;
  for (const date of dates) {
    if (!date) continue;
    if (previous && date < previous) return true;
    previous = date;
  }
  return false;
}
