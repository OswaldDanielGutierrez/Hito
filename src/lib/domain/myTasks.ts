import { weekBounds } from "./dates";
import type { ProjectStatus, TaskState } from "./types";

export interface MyTask {
  id: string;
  title: string;
  state: TaskState;
  priority: "high" | "medium" | "low";
  dueDate: string | null;
  estimatedHours: number | null;
  projectId: string;
  projectName: string;
  projectStatus: ProjectStatus;
  phaseName: string | null;
}

export type TaskGroupKey = "overdue" | "today" | "week" | "later" | "nodate";

export interface TaskGroup {
  key: TaskGroupKey;
  label: string;
  tasks: MyTask[];
}

const GROUP_LABELS: Record<TaskGroupKey, string> = {
  overdue: "Vencidas",
  today: "Hoy",
  week: "Esta semana",
  later: "Más adelante",
  nodate: "Sin fecha",
};

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

function groupOf(task: MyTask, today: string, weekEnd: string): TaskGroupKey {
  if (!task.dueDate) return "nodate";
  if (task.dueDate < today) return "overdue";
  if (task.dueDate === today) return "today";
  return task.dueDate <= weekEnd ? "week" : "later";
}

/** Agrupa las tareas abiertas por urgencia y las ordena por fecha, prioridad y título. */
export function groupMyTasks(tasks: MyTask[], today: string): TaskGroup[] {
  const { end } = weekBounds(today);
  const open = tasks.filter((t) => t.state !== "done");

  const sorted = [...open].sort(
    (a, b) =>
      (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31") ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.title.localeCompare(b.title, "es"),
  );

  return (Object.keys(GROUP_LABELS) as TaskGroupKey[]).map((key) => ({
    key,
    label: GROUP_LABELS[key],
    tasks: sorted.filter((t) => groupOf(t, today, end) === key),
  }));
}
