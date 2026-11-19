import type { PhaseInput, TaskInput } from "./types";

export interface Progress {
  done: number;
  total: number;
  percent: number;
}

function summarize(tasks: TaskInput[]): Progress {
  const topLevel = tasks.filter((t) => !t.parentTaskId);
  const done = topLevel.filter((t) => t.state === "done").length;
  const total = topLevel.length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** Avance del proyecto: tareas de primer nivel hechas / totales. */
export function projectProgress(tasks: TaskInput[]): Progress {
  return summarize(tasks);
}

export function phaseProgress(tasks: TaskInput[], phaseId: string): Progress {
  return summarize(tasks.filter((t) => t.phaseId === phaseId));
}

/** Primera fase (por posición) que no está completada. */
export function currentPhase<T extends Pick<PhaseInput, "position" | "status">>(phases: T[]): T | null {
  return [...phases].sort((a, b) => a.position - b.position).find((p) => p.status !== "completed") ?? null;
}

/** Entrega final: la mayor fecha estimada entre las fases. */
export function finalDeliveryDate(phases: Pick<PhaseInput, "estimatedDate">[]): string | null {
  const dates = phases.map((p) => p.estimatedDate).filter((d): d is string => !!d);
  return dates.length === 0 ? null : dates.reduce((max, d) => (d > max ? d : max));
}
