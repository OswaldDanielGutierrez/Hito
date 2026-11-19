import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export type ProjectStatus = Enums["project_status"];
export type PhaseStatus = Enums["phase_status"];
export type TaskState = Enums["task_state"];
export type ResourceKind = Enums["resource_kind"];

export type Health = "on_track" | "at_risk" | "late" | "on_hold";

/** Fechas como texto `yyyy-MM-dd`, igual que las columnas `date` de la BD. */
export interface PhaseInput {
  id: string;
  position: number;
  status: PhaseStatus;
  estimatedDate: string | null;
  originalDate?: string | null;
  completedAt?: string | null;
}

export interface TaskInput {
  phaseId: string;
  state: TaskState;
  parentTaskId?: string | null;
}
