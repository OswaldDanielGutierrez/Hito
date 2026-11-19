import type { AlertKind } from "./alertRules";
import { addDays, formatDayMonth } from "./dates";
import { finalDeliveryDate } from "./progress";
import type { PhaseInput, TaskState } from "./types";

export interface UpcomingAlert {
  date: string;
  time: string;
  text: string;
}

interface AlertPhase extends Pick<PhaseInput, "status" | "estimatedDate"> {
  name: string;
}

interface AlertTask {
  title: string;
  state: TaskState;
  dueDate: string | null;
  parentTaskId?: string | null;
}

export interface RuleInput {
  kind: AlertKind;
  daysBefore: number;
  enabled: boolean;
}

/** Reglas que se crean por defecto en cada proyecto. */
export const DEFAULT_RULES: RuleInput[] = [
  { kind: "phase_due_soon", daysBefore: 2, enabled: true },
  { kind: "final_due", daysBefore: 3, enabled: true },
  { kind: "final_due", daysBefore: 1, enabled: true },
  { kind: "final_due", daysBefore: 0, enabled: true },
  { kind: "task_due", daysBefore: 1, enabled: true },
];

const when = (days: number) => (days === 0 ? "hoy" : days === 1 ? "mañana" : `en ${days} días`);

/**
 * Próximas alertas según las reglas activas del proyecto (hora de Bogotá):
 * fase y tarea a las 09:00, entrega final a las 09:00 y el mismo día a las 08:00.
 * Sin reglas explícitas usa las de por defecto.
 */
export function upcomingAlerts(
  input: { phases: AlertPhase[]; tasks: AlertTask[]; deliverySettled?: boolean; rules?: RuleInput[] },
  nowDate: string,
  nowTime: string,
  limit = 3,
): UpcomingAlert[] {
  const rules = (input.rules ?? DEFAULT_RULES).filter((r) => r.enabled);
  const alerts: UpcomingAlert[] = [];

  for (const rule of rules.filter((r) => r.kind === "phase_due_soon")) {
    for (const p of input.phases) {
      if (p.status === "completed" || !p.estimatedDate) continue;
      alerts.push({
        date: addDays(p.estimatedDate, -rule.daysBefore),
        time: "09:00",
        text: `La fase ${p.name} vence el ${formatDayMonth(p.estimatedDate)}`,
      });
    }
  }

  const finalDate = input.deliverySettled ? null : finalDeliveryDate(input.phases);
  if (finalDate) {
    for (const rule of rules.filter((r) => r.kind === "final_due")) {
      alerts.push({
        date: addDays(finalDate, -rule.daysBefore),
        time: rule.daysBefore === 0 ? "08:00" : "09:00",
        text: rule.daysBefore === 0 ? "Hoy es la entrega final" : `Entrega final ${when(rule.daysBefore)}`,
      });
    }
  }

  for (const rule of rules.filter((r) => r.kind === "task_due")) {
    for (const t of input.tasks) {
      if (t.state === "done" || !t.dueDate || t.parentTaskId) continue;
      alerts.push({
        date: addDays(t.dueDate, -rule.daysBefore),
        time: "09:00",
        text: `La tarea "${t.title}" vence ${when(rule.daysBefore)}`,
      });
    }
  }

  return alerts
    .filter((a) => a.date > nowDate || (a.date === nowDate && a.time >= nowTime))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) || a.text.localeCompare(b.text, "es"))
    .slice(0, limit);
}
