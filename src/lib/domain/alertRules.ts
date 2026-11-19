export type AlertKind = "phase_due_soon" | "final_due" | "task_due" | "stale" | "overdue" | "weekly_summary";

export interface AlertRuleRow {
  kind: AlertKind;
  daysBefore: number;
  enabled: boolean;
}

export interface AlertRuleGroup {
  kind: AlertKind;
  label: string;
  description: string;
  enabled: boolean;
}

const ORDER: AlertKind[] = ["phase_due_soon", "final_due", "task_due", "stale", "overdue", "weekly_summary"];

const LABELS: Record<AlertKind, string> = {
  phase_due_soon: "Fase por vencer",
  final_due: "Entrega final",
  task_due: "Tarea por vencer",
  stale: "Proyecto sin cambios",
  overdue: "Atrasos",
  weekly_summary: "Resumen semanal",
};

/** "3 y 1 días antes, y el mismo día" a partir de los días de anticipación de las reglas. */
export function describeDays(days: number[]): string {
  const before = [...new Set(days.filter((d) => d > 0))].sort((a, b) => b - a);
  const sameDay = days.includes(0);
  const parts: string[] = [];
  if (before.length > 0) parts.push(`${before.join(" y ")} ${before.length === 1 && before[0] === 1 ? "día" : "días"} antes`);
  if (sameDay) parts.push("el mismo día");
  return parts.join(", y ");
}

function describe(kind: AlertKind, days: number[]): string {
  switch (kind) {
    case "phase_due_soon":
      return `${describeDays(days)} de la entrega de cada fase sin completar`;
    case "final_due":
      return `${describeDays(days)} de la entrega final`;
    case "task_due":
      return `${describeDays(days)} del vencimiento de cada tarea sin terminar`;
    case "stale":
      return `Tras ${Math.max(...days)} días sin cambios en un proyecto activo`;
    case "overdue":
      return "Cada día mientras haya una fase atrasada";
    case "weekly_summary":
      return "Los lunes: fases de la semana, atrasos y tareas bloqueadas";
  }
}

/** Una fila por tipo de alerta; está activa solo si todas sus reglas lo están. */
export function groupAlertRules(rules: AlertRuleRow[]): AlertRuleGroup[] {
  return ORDER.flatMap((kind) => {
    const own = rules.filter((r) => r.kind === kind);
    if (own.length === 0) return [];
    return [
      {
        kind,
        label: LABELS[kind],
        description: describe(
          kind,
          own.map((r) => r.daysBefore),
        ),
        enabled: own.every((r) => r.enabled),
      },
    ];
  });
}
