import { daysUntil } from "./dates";
import { currentPhase, finalDeliveryDate } from "./progress";
import type { Health, PhaseInput, ProjectStatus, TaskInput } from "./types";

/** Salud del proyecto. `null` si está entregado (no tiene salud). */
export function getHealth(
  project: { status: ProjectStatus },
  phases: PhaseInput[],
  tasks: TaskInput[],
  today: string,
): Health | null {
  if (project.status === "delivered") return null;
  if (project.status === "on_hold") return "on_hold";

  const finalDate = finalDeliveryDate(phases);

  const hasOverduePhase = phases.some(
    (p) => p.status !== "completed" && p.estimatedDate !== null && p.estimatedDate < today,
  );
  if (hasOverduePhase || (finalDate !== null && finalDate < today)) return "late";

  if (finalDate !== null && daysUntil(finalDate, today) <= 3) return "at_risk";

  const current = currentPhase(phases);
  if (current?.estimatedDate && daysUntil(current.estimatedDate, today) <= 2) {
    const hasOpenTasks = tasks.some(
      (t) => t.phaseId === current.id && !t.parentTaskId && t.state !== "done",
    );
    if (hasOpenTasks) return "at_risk";
  }

  return "on_track";
}
