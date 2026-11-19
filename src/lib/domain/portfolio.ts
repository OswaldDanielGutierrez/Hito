import {
  DAYS_COLORS,
  daysColor,
  daysText,
  daysUntil,
  formatDate,
  formatDayMonth,
  weekBounds,
  todayInBogota,
} from "./dates";
import { getHealth } from "./health";
import { PHASE_NOTE_COLORS } from "./phaseNote";
import { currentPhase, finalDeliveryDate, projectProgress, type Progress } from "./progress";
import type { Health, PhaseInput, PhaseStatus, ProjectStatus, TaskInput } from "./types";

export interface PortfolioProject {
  id: string;
  name: string;
  area: string | null;
  status: ProjectStatus;
  updatedAt: string;
  resources: { documents: number; flowsCode: number; links: number };
}

export interface PortfolioPhase extends PhaseInput {
  projectId: string;
  name: string;
}

export interface PortfolioTask extends TaskInput {
  projectId: string;
}

export interface Segment {
  name: string;
  status: PhaseStatus;
}

export interface ProjectCardData {
  id: string;
  name: string;
  area: string | null;
  status: ProjectStatus;
  health: Health | null;
  segments: Segment[];
  currentName: string | null;
  currentIndex: number;
  phasesTotal: number;
  phaseLine: { text: string; color: string };
  tasks: Progress;
  finalLine: { text: string; color: string };
  resources: PortfolioProject["resources"];
  updatedAt: string;
}

export interface PortfolioStats {
  activeProjects: number;
  totalProjects: number;
  phasesThisWeek: number;
  openTasks: number;
  latePhases: number;
}

export type StatusFilter = "all" | ProjectStatus;

export interface Portfolio {
  cards: ProjectCardData[];
  stats: PortfolioStats;
  counts: Record<StatusFilter, number>;
}

function phaseLineFor(
  status: ProjectStatus,
  health: Health | null,
  current: PortfolioPhase | null,
  today: string,
  phasesTotal: number,
): { text: string; color: string } {
  if (status === "delivered") return { text: "Proyecto entregado", color: PHASE_NOTE_COLORS.onTime };
  if (phasesTotal === 0) return { text: "Sin fases", color: DAYS_COLORS.normal };
  if (!current) return { text: "Todas las fases completadas", color: DAYS_COLORS.normal };
  if (health === "on_hold") return { text: `Detenido en ${current.name}`, color: DAYS_COLORS.normal };

  const date = current.estimatedDate;
  if (!date) return { text: `${current.name} sin fecha estimada`, color: DAYS_COLORS.normal };

  const days = daysUntil(date, today);
  if (health === "late") {
    const text =
      days < 0
        ? `${current.name} debía terminar el ${formatDayMonth(date)} · ${daysText(days)}`
        : `${current.name} termina el ${formatDayMonth(date)}`;
    return { text, color: PHASE_NOTE_COLORS.late };
  }
  return {
    text: `${current.name} termina el ${formatDayMonth(date)}`,
    color: health === "at_risk" ? PHASE_NOTE_COLORS.inProgress : DAYS_COLORS.normal,
  };
}

function finalLineFor(
  status: ProjectStatus,
  finalDate: string | null,
  phases: PortfolioPhase[],
  updatedAt: string,
  today: string,
): { text: string; color: string } {
  if (status === "delivered") {
    const completed = phases.map((p) => p.completedAt).filter((d): d is string => !!d);
    const closed = completed.length > 0 ? completed.reduce((a, b) => (b > a ? b : a)) : todayInBogota(new Date(updatedAt));
    return { text: `Cerrado el ${formatDate(closed)}`, color: DAYS_COLORS.normal };
  }
  if (!finalDate) return { text: "Sin fecha", color: DAYS_COLORS.normal };
  const days = daysUntil(finalDate, today);
  return { text: `${formatDate(finalDate)} · ${daysText(days)}`, color: daysColor(days) };
}

type Sortable = { card: ProjectCardData; finalDate: string | null };

function compareCards(a: Sortable, b: Sortable): number {
  const aDelivered = a.card.status === "delivered";
  const bDelivered = b.card.status === "delivered";
  if (aDelivered !== bDelivered) return aDelivered ? 1 : -1;
  if (a.finalDate === b.finalDate) return a.card.name.localeCompare(b.card.name, "es");
  if (!a.finalDate) return 1;
  if (!b.finalDate) return -1;
  return aDelivered ? b.finalDate.localeCompare(a.finalDate) : a.finalDate.localeCompare(b.finalDate);
}

/** Datos de la pantalla Inicio: tarjetas ordenadas por entrega más cercana, indicadores y contadores. */
export function buildPortfolio(
  input: { projects: PortfolioProject[]; phases: PortfolioPhase[]; tasks: PortfolioTask[] },
  today: string,
): Portfolio {
  const sortable: Sortable[] = input.projects.map((project) => {
    const phases = input.phases.filter((p) => p.projectId === project.id).sort((a, b) => a.position - b.position);
    const tasks = input.tasks.filter((t) => t.projectId === project.id);
    const current = currentPhase(phases);
    const finalDate = finalDeliveryDate(phases);
    const health = getHealth(project, phases, tasks, today);

    const card: ProjectCardData = {
      id: project.id,
      name: project.name,
      area: project.area,
      status: project.status,
      health,
      segments: phases.map((p) => ({ name: p.name, status: p.status })),
      currentName: current?.name ?? null,
      currentIndex: current ? phases.indexOf(current) + 1 : phases.length,
      phasesTotal: phases.length,
      phaseLine: phaseLineFor(project.status, health, current, today, phases.length),
      tasks: projectProgress(tasks),
      finalLine: finalLineFor(project.status, finalDate, phases, project.updatedAt, today),
      resources: project.resources,
      updatedAt: project.updatedAt,
    };
    return { card, finalDate };
  });

  const cards = sortable.sort(compareCards).map((s) => s.card);

  const week = weekBounds(today);
  const activeIds = new Set(input.projects.filter((p) => p.status !== "delivered").map((p) => p.id));
  const activePhases = input.phases.filter((p) => activeIds.has(p.projectId) && p.status !== "completed");

  const stats: PortfolioStats = {
    activeProjects: activeIds.size,
    totalProjects: input.projects.length,
    phasesThisWeek: activePhases.filter((p) => p.estimatedDate && p.estimatedDate >= today && p.estimatedDate <= week.end).length,
    openTasks: input.tasks.filter((t) => activeIds.has(t.projectId) && !t.parentTaskId && t.state !== "done").length,
    latePhases: activePhases.filter((p) => p.estimatedDate && p.estimatedDate < today).length,
  };

  const counts: Record<StatusFilter, number> = {
    all: input.projects.length,
    development: 0,
    qa: 0,
    production: 0,
    delivered: 0,
    on_hold: 0,
  };
  for (const p of input.projects) counts[p.status]++;

  return { cards, stats, counts };
}
