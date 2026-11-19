import { describe, expect, it } from "vitest";
import { currentPhase, finalDeliveryDate, phaseProgress, projectProgress } from "./progress";
import type { TaskInput } from "./types";

const t = (phaseId: string, state: TaskInput["state"], parentTaskId?: string): TaskInput => ({
  phaseId,
  state,
  parentTaskId,
});

describe("progreso", () => {
  it("sin tareas es 0 %", () => {
    expect(projectProgress([])).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it("tareas hechas / totales", () => {
    const tasks = [t("a", "done"), t("a", "done"), t("a", "pending"), t("b", "blocked")];
    expect(projectProgress(tasks)).toEqual({ done: 2, total: 4, percent: 50 });
  });

  it("ignora subtareas", () => {
    const tasks = [t("a", "done"), t("a", "pending", "padre")];
    expect(projectProgress(tasks)).toEqual({ done: 1, total: 1, percent: 100 });
  });

  it("filtra por fase", () => {
    const tasks = [t("a", "done"), t("a", "pending"), t("b", "done")];
    expect(phaseProgress(tasks, "a")).toEqual({ done: 1, total: 2, percent: 50 });
    expect(phaseProgress(tasks, "b")).toEqual({ done: 1, total: 1, percent: 100 });
    expect(phaseProgress(tasks, "c")).toEqual({ done: 0, total: 0, percent: 0 });
  });
});

describe("fase actual y entrega final", () => {
  const phases = [
    { id: "c", position: 3, status: "pending" as const, estimatedDate: "2026-12-30" },
    { id: "a", position: 1, status: "completed" as const, estimatedDate: "2026-11-01" },
    { id: "b", position: 2, status: "in_progress" as const, estimatedDate: "2026-12-10" },
  ];

  it("es la primera por posición no completada", () => {
    expect(currentPhase(phases)?.id).toBe("b");
  });

  it("no hay fase actual si todas están completadas", () => {
    expect(currentPhase(phases.map((p) => ({ ...p, status: "completed" as const })))).toBeNull();
  });

  it("la entrega final es la mayor fecha estimada", () => {
    expect(finalDeliveryDate(phases)).toBe("2026-12-30");
    expect(finalDeliveryDate([{ estimatedDate: null }])).toBeNull();
  });
});
