import { describe, expect, it } from "vitest";
import { buildPortfolio, type PortfolioPhase, type PortfolioProject, type PortfolioTask } from "./portfolio";

const TODAY = "2026-11-18";
const noResources = { documents: 0, flowsCode: 0, links: 0 };

const project = (id: string, status: PortfolioProject["status"], over: Partial<PortfolioProject> = {}): PortfolioProject => ({
  id,
  name: `Proyecto ${id}`,
  area: null,
  status,
  updatedAt: "2026-11-17T15:00:00Z",
  resources: noResources,
  ...over,
});

const phase = (projectId: string, position: number, over: Partial<PortfolioPhase> = {}): PortfolioPhase => ({
  id: `${projectId}-${position}`,
  projectId,
  name: `Fase ${position}`,
  position,
  status: "pending",
  estimatedDate: null,
  ...over,
});

const task = (projectId: string, phaseId: string, state: PortfolioTask["state"]): PortfolioTask => ({
  projectId,
  phaseId,
  state,
});

describe("buildPortfolio", () => {
  const input = {
    projects: [
      project("lejos", "development"),
      project("cerca", "qa"),
      project("tarde", "production"),
      project("hecho", "delivered"),
      project("pausa", "on_hold"),
    ],
    phases: [
      phase("lejos", 1, { status: "in_progress", estimatedDate: "2026-12-20" }),
      phase("cerca", 1, { status: "completed", estimatedDate: "2026-11-10", completedAt: "2026-11-10" }),
      phase("cerca", 2, { status: "in_progress", estimatedDate: "2026-11-20" }),
      phase("tarde", 1, { status: "in_progress", estimatedDate: "2026-11-16" }),
      phase("hecho", 1, { status: "completed", estimatedDate: "2026-10-01", completedAt: "2026-10-02" }),
      phase("pausa", 1, { status: "in_progress", estimatedDate: "2026-11-30" }),
    ],
    tasks: [
      task("cerca", "cerca-2", "done"),
      task("cerca", "cerca-2", "in_progress"),
      task("tarde", "tarde-1", "pending"),
      task("lejos", "lejos-1", "pending"),
      task("hecho", "hecho-1", "done"),
    ],
  };
  const result = buildPortfolio(input, TODAY);

  it("ordena por entrega más cercana y deja los entregados al final", () => {
    expect(result.cards.map((c) => c.id)).toEqual(["tarde", "cerca", "pausa", "lejos", "hecho"]);
  });

  it("cuenta proyectos por estado", () => {
    expect(result.counts).toEqual({
      all: 5,
      development: 1,
      qa: 1,
      production: 1,
      delivered: 1,
      on_hold: 1,
    });
  });

  it("calcula los indicadores sobre proyectos no entregados", () => {
    expect(result.stats).toEqual({
      activeProjects: 4,
      totalProjects: 5,
      phasesThisWeek: 1, // solo la fase 2 de "cerca" (20/11): las ya vencidas no cuentan como "terminan esta semana"
      openTasks: 3,
      latePhases: 1, // la fase 1 de "tarde" venció el 16/11
    });
  });

  it("textos de fase por situación", () => {
    const by = (id: string) => result.cards.find((c) => c.id === id)!;
    expect(by("tarde").phaseLine).toEqual({
      text: "Fase 1 debía terminar el 16/11 · 2 días tarde",
      color: "#B42318",
    });
    expect(by("cerca").phaseLine).toEqual({ text: "Fase 2 termina el 20/11", color: "#8A4A0B" });
    expect(by("lejos").phaseLine).toEqual({ text: "Fase 1 termina el 20/12", color: "#58635D" });
    expect(by("pausa").phaseLine.text).toBe("Detenido en Fase 1");
    expect(by("hecho").phaseLine.text).toBe("Proyecto entregado");
  });

  it("entrega final con días y color", () => {
    const by = (id: string) => result.cards.find((c) => c.id === id)!;
    expect(by("cerca").finalLine).toEqual({ text: "20/11/2026 · En 2 días", color: "#8A4A0B" });
    expect(by("lejos").finalLine.text).toBe("20/12/2026 · En 32 días");
    expect(by("tarde").finalLine).toEqual({ text: "16/11/2026 · 2 días tarde", color: "#B42318" });
    expect(by("hecho").finalLine.text).toBe("Cerrado el 02/10/2026");
  });

  it("fase actual, avance y salud", () => {
    const cerca = result.cards.find((c) => c.id === "cerca")!;
    expect(cerca.currentName).toBe("Fase 2");
    expect(cerca.currentIndex).toBe(2);
    expect(cerca.phasesTotal).toBe(2);
    expect(cerca.tasks).toEqual({ done: 1, total: 2, percent: 50 });
    expect(cerca.health).toBe("at_risk");
    expect(result.cards.find((c) => c.id === "tarde")!.health).toBe("late");
    expect(result.cards.find((c) => c.id === "hecho")!.health).toBeNull();
  });

  it("sin proyectos devuelve todo en cero", () => {
    const empty = buildPortfolio({ projects: [], phases: [], tasks: [] }, TODAY);
    expect(empty.cards).toEqual([]);
    expect(empty.stats.activeProjects).toBe(0);
    expect(empty.counts.all).toBe(0);
  });

  it("proyecto sin fases", () => {
    const r = buildPortfolio({ projects: [project("x", "development")], phases: [], tasks: [] }, TODAY);
    expect(r.cards[0].phaseLine.text).toBe("Sin fases");
    expect(r.cards[0].finalLine.text).toBe("Sin fecha");
  });
});
