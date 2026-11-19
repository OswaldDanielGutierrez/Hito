import { describe, expect, it } from "vitest";
import { calculatePhaseDates, hasDatesOutOfOrder } from "./templates";

describe("calculatePhaseDates", () => {
  it("suma offset_days a la fecha de inicio", () => {
    const result = calculatePhaseDates("2026-11-02", [
      { name: "Levantamiento", offset_days: 7 },
      { name: "Desarrollo", offset_days: 28 },
      { name: "Producción", offset_days: 63 },
    ]);
    expect(result).toEqual([
      { name: "Levantamiento", date: "2026-11-09" },
      { name: "Desarrollo", date: "2026-11-30" },
      { name: "Producción", date: "2027-01-04" },
    ]);
  });

  it("sin fases devuelve lista vacía", () => {
    expect(calculatePhaseDates("2026-11-02", [])).toEqual([]);
  });
});

describe("hasDatesOutOfOrder", () => {
  it("detecta fechas fuera de orden", () => {
    expect(hasDatesOutOfOrder(["2026-11-10", "2026-11-05"])).toBe(true);
  });

  it("acepta fechas en orden o iguales", () => {
    expect(hasDatesOutOfOrder(["2026-11-05", "2026-11-05", "2026-11-10"])).toBe(false);
  });

  it("ignora fechas vacías", () => {
    expect(hasDatesOutOfOrder(["2026-11-05", null, "2026-11-10"])).toBe(false);
    expect(hasDatesOutOfOrder(["2026-11-10", null, "2026-11-05"])).toBe(true);
  });
});
