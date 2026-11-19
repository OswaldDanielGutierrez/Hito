import { describe, expect, it } from "vitest";
import { getHealth } from "./health";
import type { PhaseInput, TaskInput } from "./types";

const TODAY = "2026-11-18";

const phase = (over: Partial<PhaseInput> & Pick<PhaseInput, "id" | "position">): PhaseInput => ({
  status: "pending",
  estimatedDate: null,
  ...over,
});

const task = (phaseId: string, state: TaskInput["state"], parentTaskId?: string): TaskInput => ({
  phaseId,
  state,
  parentTaskId,
});

const dev = { status: "development" } as const;

describe("getHealth", () => {
  it("entregado: no tiene salud", () => {
    const phases = [phase({ id: "a", position: 1, status: "pending", estimatedDate: "2026-01-01" })];
    expect(getHealth({ status: "delivered" }, phases, [], TODAY)).toBeNull();
  });

  it("en espera: Detenido, aunque esté atrasado", () => {
    const phases = [phase({ id: "a", position: 1, estimatedDate: "2026-01-01" })];
    expect(getHealth({ status: "on_hold" }, phases, [], TODAY)).toBe("on_hold");
  });

  it("atrasado: fase no completada con fecha pasada", () => {
    const phases = [
      phase({ id: "a", position: 1, status: "in_progress", estimatedDate: "2026-11-16" }),
      phase({ id: "b", position: 2, estimatedDate: "2026-12-30" }),
    ];
    expect(getHealth(dev, phases, [], TODAY)).toBe("late");
  });

  it("atrasado: la entrega final ya pasó", () => {
    const phases = [phase({ id: "a", position: 1, status: "completed", estimatedDate: "2026-11-10" })];
    expect(getHealth(dev, phases, [], TODAY)).toBe("late");
  });

  it("una fase completada con fecha pasada no atrasa al proyecto", () => {
    const phases = [
      phase({ id: "a", position: 1, status: "completed", estimatedDate: "2026-11-01" }),
      phase({ id: "b", position: 2, status: "in_progress", estimatedDate: "2026-12-30" }),
    ];
    expect(getHealth(dev, phases, [], TODAY)).toBe("on_track");
  });

  it("en riesgo: entrega final a 3 días", () => {
    const phases = [
      phase({ id: "a", position: 1, status: "completed", estimatedDate: "2026-11-10" }),
      phase({ id: "b", position: 2, status: "in_progress", estimatedDate: "2026-11-21" }),
    ];
    expect(getHealth(dev, phases, [], TODAY)).toBe("at_risk");
  });

  it("al día: entrega final a 4 días", () => {
    const phases = [phase({ id: "a", position: 1, status: "in_progress", estimatedDate: "2026-11-22" })];
    expect(getHealth(dev, phases, [], TODAY)).toBe("on_track");
  });

  it("en riesgo: fase actual a 2 días con tareas sin terminar", () => {
    const phases = [
      phase({ id: "a", position: 1, status: "in_progress", estimatedDate: "2026-11-20" }),
      phase({ id: "b", position: 2, estimatedDate: "2026-12-30" }),
    ];
    const tasks = [task("a", "done"), task("a", "in_progress")];
    expect(getHealth(dev, phases, tasks, TODAY)).toBe("at_risk");
  });

  it("al día: fase actual a 2 días pero con todas las tareas hechas", () => {
    const phases = [
      phase({ id: "a", position: 1, status: "in_progress", estimatedDate: "2026-11-20" }),
      phase({ id: "b", position: 2, estimatedDate: "2026-12-30" }),
    ];
    const tasks = [task("a", "done"), task("a", "done")];
    expect(getHealth(dev, phases, tasks, TODAY)).toBe("on_track");
  });

  it("las subtareas pendientes no cuentan como tareas sin terminar", () => {
    const phases = [
      phase({ id: "a", position: 1, status: "in_progress", estimatedDate: "2026-11-20" }),
      phase({ id: "b", position: 2, estimatedDate: "2026-12-30" }),
    ];
    const tasks = [task("a", "done"), task("a", "pending", "padre")];
    expect(getHealth(dev, phases, tasks, TODAY)).toBe("on_track");
  });

  it("al día: fechas lejanas", () => {
    const phases = [
      phase({ id: "a", position: 1, status: "in_progress", estimatedDate: "2026-12-10" }),
      phase({ id: "b", position: 2, estimatedDate: "2026-12-30" }),
    ];
    expect(getHealth(dev, phases, [task("a", "pending")], TODAY)).toBe("on_track");
  });

  it("toma la fase actual por posición, sin importar el orden del arreglo", () => {
    const phases = [
      phase({ id: "b", position: 2, estimatedDate: "2026-12-30" }),
      phase({ id: "a", position: 1, status: "in_progress", estimatedDate: "2026-11-19" }),
    ];
    expect(getHealth(dev, phases, [task("a", "pending")], TODAY)).toBe("at_risk");
  });
});
