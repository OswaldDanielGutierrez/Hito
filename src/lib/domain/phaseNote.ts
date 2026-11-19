import { diffDays, formatDayMonth } from "./dates";
import type { PhaseInput } from "./types";

export const PHASE_NOTE_COLORS = {
  onTime: "#00652F",
  late: "#B42318",
  inProgress: "#8A4A0B",
  upcoming: "#58635D",
} as const;

export interface PhaseNote {
  text: string;
  color: string;
}

/** Texto y color bajo la fecha estimada de cada fase. */
export function phaseNote(
  phase: Pick<PhaseInput, "status" | "estimatedDate" | "originalDate" | "completedAt">,
): PhaseNote {
  const { status, estimatedDate, originalDate, completedAt } = phase;

  if (status === "completed" && completedAt && estimatedDate) {
    if (completedAt <= estimatedDate) {
      return { text: "Terminó a tiempo", color: PHASE_NOTE_COLORS.onTime };
    }
    const lateDays = diffDays(estimatedDate, completedAt);
    return {
      text: `Terminó el ${formatDayMonth(completedAt)} · ${lateDays} ${lateDays === 1 ? "día" : "días"} tarde`,
      color: PHASE_NOTE_COLORS.late,
    };
  }

  if (status === "in_progress") {
    const moved = !!originalDate && !!estimatedDate && originalDate !== estimatedDate;
    return {
      text: moved ? `En curso · plan inicial ${formatDayMonth(originalDate)}` : "En curso",
      color: PHASE_NOTE_COLORS.inProgress,
    };
  }

  return { text: "Próxima", color: PHASE_NOTE_COLORS.upcoming };
}
