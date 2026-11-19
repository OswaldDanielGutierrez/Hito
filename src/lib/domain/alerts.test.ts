import { describe, expect, it } from "vitest";
import { upcomingAlerts } from "./alerts";

const phases = [
  { name: "Desarrollo", status: "completed" as const, estimatedDate: "2026-11-01" },
  { name: "QA", status: "in_progress" as const, estimatedDate: "2026-11-24" },
  { name: "Producción", status: "pending" as const, estimatedDate: "2026-11-30" },
];

describe("upcomingAlerts", () => {
  it("devuelve las 3 siguientes en orden cronológico", () => {
    const result = upcomingAlerts({ phases, tasks: [] }, "2026-11-18", "10:00");
    expect(result).toEqual([
      { date: "2026-11-22", time: "09:00", text: "La fase QA vence el 24/11" },
      { date: "2026-11-27", time: "09:00", text: "Entrega final en 3 días" },
      { date: "2026-11-28", time: "09:00", text: "La fase Producción vence el 30/11" },
    ]);
  });

  it("no incluye fases completadas ni alertas pasadas", () => {
    const result = upcomingAlerts({ phases, tasks: [] }, "2026-11-23", "09:00", 10);
    expect(result.map((a) => a.text)).toEqual([
      "Entrega final en 3 días",
      "La fase Producción vence el 30/11",
      "Entrega final mañana",
      "Hoy es la entrega final",
    ]);
  });

  it("una alerta de hoy a la misma hora todavía cuenta; una anterior no", () => {
    const at9 = upcomingAlerts({ phases, tasks: [] }, "2026-11-22", "09:00", 1);
    expect(at9[0]).toMatchObject({ date: "2026-11-22", time: "09:00" });
    const at9_01 = upcomingAlerts({ phases, tasks: [] }, "2026-11-22", "09:01", 1);
    expect(at9_01[0].date).not.toBe("2026-11-22");
  });

  it("alerta el día anterior al vencimiento de tareas sin terminar", () => {
    const tasks = [
      { title: "Pruebas", state: "pending" as const, dueDate: "2026-11-20" },
      { title: "Hecha", state: "done" as const, dueDate: "2026-11-20" },
      { title: "Sin fecha", state: "pending" as const, dueDate: null },
    ];
    const result = upcomingAlerts({ phases: [], tasks }, "2026-11-18", "10:00");
    expect(result).toEqual([{ date: "2026-11-19", time: "09:00", text: 'La tarea "Pruebas" vence mañana' }]);
  });

  it("proyecto entregado no avisa la entrega final", () => {
    const result = upcomingAlerts({ phases: [], tasks: [], deliverySettled: true }, "2026-11-18", "10:00");
    expect(result).toEqual([]);
  });

  it("respeta las reglas desactivadas", () => {
    const rules = [
      { kind: "phase_due_soon" as const, daysBefore: 2, enabled: false },
      { kind: "final_due" as const, daysBefore: 3, enabled: true },
    ];
    const result = upcomingAlerts({ phases, tasks: [], rules }, "2026-11-18", "10:00", 10);
    expect(result.map((a) => a.text)).toEqual(["Entrega final en 3 días"]);
  });

  it("usa los días de anticipación de cada regla", () => {
    const rules = [{ kind: "phase_due_soon" as const, daysBefore: 5, enabled: true }];
    const result = upcomingAlerts({ phases, tasks: [], rules }, "2026-11-10", "10:00", 10);
    expect(result).toEqual([
      { date: "2026-11-19", time: "09:00", text: "La fase QA vence el 24/11" },
      { date: "2026-11-25", time: "09:00", text: "La fase Producción vence el 30/11" },
    ]);
  });

  it("sin reglas activas no hay alertas", () => {
    const rules = [{ kind: "final_due" as const, daysBefore: 1, enabled: false }];
    expect(upcomingAlerts({ phases, tasks: [], rules }, "2026-11-10", "10:00")).toEqual([]);
  });
});
