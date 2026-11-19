import type { ResourceKind, TaskState } from "@/lib/domain/types";

type Pair = { bg: string; ink: string };

export const taskStateColors: Record<TaskState, Pair> = {
  pending: { bg: "#C9D0CC", ink: "#17201B" },
  in_progress: { bg: "#D9822B", ink: "#17201B" },
  done: { bg: "#007A3D", ink: "#FFFFFF" },
  blocked: { bg: "#B42318", ink: "#FFFFFF" },
};

export const priorityColors: Record<"high" | "medium" | "low", Pair> = {
  high: { bg: "#FDECEA", ink: "#B42318" },
  medium: { bg: "#FDF0E3", ink: "#8A4A0B" },
  low: { bg: "#EEF2F0", ink: "#58635D" },
};

export const resourceKindColors: Record<ResourceKind, Pair> = {
  document: { bg: "#E6F0FB", ink: "#1D4F91" },
  flow: { bg: "#E4F5EB", ink: "#007A3D" },
  code: { bg: "#EEF2F0", ink: "#17201B" },
  link: { bg: "#FDF0E3", ink: "#8A4A0B" },
};

export const fieldClass =
  "h-10 w-full rounded-input border border-input-border bg-white px-3 text-base sm:text-sm disabled:opacity-60";
export const labelClass = "mb-1 block text-xs font-medium text-muted";

export const changeKindColors: Record<"status" | "date" | "task" | "phase" | "scope", Pair> = {
  status: { bg: "#FDF0E3", ink: "#8A4A0B" },
  date: { bg: "#FDECEA", ink: "#B42318" },
  task: { bg: "#E6F0FB", ink: "#1D4F91" },
  phase: { bg: "#E4F5EB", ink: "#00652F" },
  scope: { bg: "#EEF2F0", ink: "#58635D" },
};
