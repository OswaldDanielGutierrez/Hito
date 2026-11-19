import { describe, expect, it } from "vitest";
import { describeDays, groupAlertRules, type AlertRuleRow } from "./alertRules";

const rule = (kind: AlertRuleRow["kind"], daysBefore: number, enabled = true): AlertRuleRow => ({ kind, daysBefore, enabled });

describe("describeDays", () => {
  it("describe los días de anticipación", () => {
    expect(describeDays([2])).toBe("2 días antes");
    expect(describeDays([1])).toBe("1 día antes");
    expect(describeDays([3, 1, 0])).toBe("3 y 1 días antes, y el mismo día");
    expect(describeDays([0])).toBe("el mismo día");
  });
});

describe("groupAlertRules", () => {
  const groups = groupAlertRules([
    rule("final_due", 3),
    rule("final_due", 1),
    rule("final_due", 0, false),
    rule("phase_due_soon", 2),
    rule("stale", 5),
  ]);

  it("agrupa por tipo en orden fijo y omite los que no existen", () => {
    expect(groups.map((g) => g.kind)).toEqual(["phase_due_soon", "final_due", "stale"]);
  });

  it("un tipo solo está activo si todas sus reglas lo están", () => {
    expect(groups.find((g) => g.kind === "final_due")!.enabled).toBe(false);
    expect(groups.find((g) => g.kind === "phase_due_soon")!.enabled).toBe(true);
  });

  it("genera etiquetas y descripciones", () => {
    expect(groups[0]).toMatchObject({ label: "Fase por vencer", description: "2 días antes de la entrega de cada fase sin completar" });
    expect(groups[2].description).toBe("Tras 5 días sin cambios en un proyecto activo");
  });
});
