import { describe, expect, it } from "vitest";
import { phaseNote } from "./phaseNote";

describe("phaseNote", () => {
  it("completada a tiempo", () => {
    expect(
      phaseNote({ status: "completed", estimatedDate: "2026-11-10", originalDate: "2026-11-10", completedAt: "2026-11-09" }),
    ).toEqual({ text: "Terminó a tiempo", color: "#00652F" });
  });

  it("completada sin fecha estimada muestra solo cuándo terminó", () => {
    expect(
      phaseNote({ status: "completed", estimatedDate: null, originalDate: null, completedAt: "2026-11-03" }),
    ).toEqual({ text: "Terminó el 03/11", color: "#00652F" });
  });

  it("completada sin fechas dice solo que está terminada", () => {
    expect(
      phaseNote({ status: "completed", estimatedDate: null, originalDate: null, completedAt: null }),
    ).toEqual({ text: "Terminada", color: "#00652F" });
  });

  it("completada justo en la fecha estimada cuenta como a tiempo", () => {
    expect(
      phaseNote({ status: "completed", estimatedDate: "2026-11-10", originalDate: "2026-11-10", completedAt: "2026-11-10" }).text,
    ).toBe("Terminó a tiempo");
  });

  it("completada tarde", () => {
    expect(
      phaseNote({ status: "completed", estimatedDate: "2026-11-10", originalDate: "2026-11-10", completedAt: "2026-11-13" }),
    ).toEqual({ text: "Terminó el 13/11 · 3 días tarde", color: "#B42318" });
  });

  it("completada con un día de retraso usa singular", () => {
    expect(
      phaseNote({ status: "completed", estimatedDate: "2026-11-10", originalDate: "2026-11-10", completedAt: "2026-11-11" }).text,
    ).toBe("Terminó el 11/11 · 1 día tarde");
  });

  it("en curso con la fecha original", () => {
    expect(
      phaseNote({ status: "in_progress", estimatedDate: "2026-11-20", originalDate: "2026-11-20" }),
    ).toEqual({ text: "En curso", color: "#8A4A0B" });
  });

  it("en curso con plan original distinto de la estimada", () => {
    expect(
      phaseNote({ status: "in_progress", estimatedDate: "2026-11-25", originalDate: "2026-11-20" }),
    ).toEqual({ text: "En curso · plan inicial 20/11", color: "#8A4A0B" });
  });

  it("futura", () => {
    expect(
      phaseNote({ status: "pending", estimatedDate: "2026-12-01", originalDate: "2026-12-01" }),
    ).toEqual({ text: "Próxima", color: "#58635D" });
  });
});
