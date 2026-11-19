import { addDays, daysText, formatDayMonth } from "./dates";
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

/**
 * Próximas alertas según las reglas por defecto (hora de Bogotá):
 * fase 2 días antes (09:00), entrega final 3 y 1 día antes (09:00) y el día (08:00),
 * tarea el día anterior a su vencimiento (09:00).
 */
export function upcomingAlerts(
  input: { phases: AlertPhase[]; tasks: AlertTask[]; deliverySettled?: boolean },
  nowDate: string,
  nowTime: string,
  limit = 3,
): UpcomingAlert[] {
  const alerts: UpcomingAlert[] = [];

  for (const p of input.phases) {
    if (p.status === "completed" || !p.estimatedDate) continue;
    alerts.push({
      date: addDays(p.estimatedDate, -2),
      time: "09:00",
      text: `La fase ${p.name} vence el ${formatDayMonth(p.estimatedDate)}`,
    });
  }

  const finalDate = input.deliverySettled ? null : finalDeliveryDate(input.phases);
  if (finalDate) {
    alerts.push({ date: addDays(finalDate, -3), time: "09:00", text: `Entrega final ${daysText(3).toLowerCase()}` });
    alerts.push({ date: addDays(finalDate, -1), time: "09:00", text: `Entrega final ${daysText(1).toLowerCase()}` });
    alerts.push({ date: finalDate, time: "08:00", text: "Hoy es la entrega final" });
  }

  for (const t of input.tasks) {
    if (t.state === "done" || !t.dueDate || t.parentTaskId) continue;
    alerts.push({ date: addDays(t.dueDate, -1), time: "09:00", text: `La tarea "${t.title}" vence mañana` });
  }

  return alerts
    .filter((a) => a.date > nowDate || (a.date === nowDate && a.time >= nowTime))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) || a.text.localeCompare(b.text, "es"))
    .slice(0, limit);
}
