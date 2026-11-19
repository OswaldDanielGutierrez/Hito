import { describe, expect, it } from "vitest";
import { scheduleNotice } from "./scheduleNotice";
import type { PhaseInput } from "./types";

const phase = (position: number, over: Partial<PhaseInput & { name: string }> = {}): PhaseInput & { name: string } => ({
  id: `p${position}`,
  name: `Fase ${position}`,
  position,
  status: "pending",
  estimatedDate: "2026-12-01",
  originalDate: "2026-12-01",
  ...over,
});

describe("scheduleNotice", () => {
  it("sin corrimiento no hay aviso", () => {
    expect(scheduleNotice([phase(1, { status: "in_progress" })])).toBeNull();
  });

  it("fase actual corrida y entrega final sin cambio", () => {
    const phases = [
      phase(1, { name: "QA", status: "in_progress", estimatedDate: "2026-11-21", originalDate: "2026-11-18" }),
      phase(2, { estimatedDate: "2026-11-25", originalDate: "2026-11-25" }),
    ];
    expect(scheduleNotice(phases)).toBe(
      "La fase QA va 3 días corrida respecto al plan inicial (18/11). La entrega final sigue estimada para el 25/11.",
    );
  });

  it("la entrega final también se movió", () => {
    const phases = [
      phase(1, { name: "QA", status: "in_progress", estimatedDate: "2026-11-21", originalDate: "2026-11-20" }),
      phase(2, { estimatedDate: "2026-11-26", originalDate: "2026-11-25" }),
    ];
    expect(scheduleNotice(phases)).toBe(
      "La fase QA va 1 día corrida respecto al plan inicial (20/11). La entrega final pasa a estar estimada para el 26/11.",
    );
  });

  it("fase adelantada", () => {
    const phases = [phase(1, { name: "QA", status: "in_progress", estimatedDate: "2026-11-18", originalDate: "2026-11-20" })];
    expect(scheduleNotice(phases)).toContain("va 2 días adelantada respecto al plan inicial (20/11)");
  });

  it("solo mira la fase actual, no las futuras ni las completadas", () => {
    const phases = [
      phase(1, { status: "completed", estimatedDate: "2026-11-10", originalDate: "2026-11-05" }),
      phase(2, { status: "in_progress" }),
      phase(3, { estimatedDate: "2026-12-20", originalDate: "2026-12-10" }),
    ];
    expect(scheduleNotice(phases)).toBeNull();
  });

  it("sin fase actual no hay aviso", () => {
    expect(scheduleNotice([phase(1, { status: "completed" })])).toBeNull();
  });
});
