import { describe, expect, it } from "vitest";
import {
  addDays,
  daysColor,
  daysText,
  daysUntil,
  diffDays,
  formatDate,
  formatDayMonth,
  formatLongDate,
  greeting,
  isInCurrentWeek,
  todayInBogota,
  weekBounds,
} from "./dates";

describe("todayInBogota", () => {
  it("usa la fecha de Bogotá, no la UTC", () => {
    // 03:00 UTC del 19/11 son las 22:00 del 18/11 en Bogotá (UTC-5)
    expect(todayInBogota(new Date("2026-11-19T03:00:00Z"))).toBe("2026-11-18");
    expect(todayInBogota(new Date("2026-11-19T05:00:00Z"))).toBe("2026-11-19");
  });
});

describe("diferencias y formato", () => {
  it("calcula días hasta una fecha", () => {
    expect(daysUntil("2026-11-20", "2026-11-18")).toBe(2);
    expect(daysUntil("2026-11-18", "2026-11-18")).toBe(0);
    expect(daysUntil("2026-11-16", "2026-11-18")).toBe(-2);
    expect(diffDays("2026-02-27", "2026-03-02")).toBe(3);
  });

  it("suma días cruzando mes y año", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("formatea dd/MM/yyyy y dd/MM", () => {
    expect(formatDate("2026-11-05")).toBe("05/11/2026");
    expect(formatDayMonth("2026-11-05")).toBe("05/11");
  });
});

describe("daysText y daysColor", () => {
  it("genera el texto de días", () => {
    expect(daysText(5)).toBe("En 5 días");
    expect(daysText(2)).toBe("En 2 días");
    expect(daysText(1)).toBe("Mañana");
    expect(daysText(0)).toBe("Hoy");
    expect(daysText(-1)).toBe("1 día tarde");
    expect(daysText(-3)).toBe("3 días tarde");
  });

  it("colorea según la regla", () => {
    expect(daysColor(-1)).toBe("#B42318");
    expect(daysColor(0)).toBe("#8A4A0B");
    expect(daysColor(3)).toBe("#8A4A0B");
    expect(daysColor(4)).toBe("#58635D");
  });
});

describe("semana actual", () => {
  it("va de lunes a domingo", () => {
    // 18/11/2026 es miércoles
    expect(weekBounds("2026-11-18")).toEqual({ start: "2026-11-16", end: "2026-11-22" });
    expect(weekBounds("2026-11-16")).toEqual({ start: "2026-11-16", end: "2026-11-22" });
    // domingo pertenece a la semana que empezó el lunes anterior
    expect(weekBounds("2026-11-22")).toEqual({ start: "2026-11-16", end: "2026-11-22" });
  });

  it("detecta si una fecha cae en la semana", () => {
    expect(isInCurrentWeek("2026-11-20", "2026-11-18")).toBe(true);
    expect(isInCurrentWeek("2026-11-23", "2026-11-18")).toBe(false);
    expect(isInCurrentWeek("2026-11-15", "2026-11-18")).toBe(false);
  });
});

describe("saludo y fecha larga", () => {
  it("cambia el saludo a las 12:00 y a las 19:00 de Bogotá", () => {
    expect(greeting(new Date("2026-11-19T16:59:00Z"))).toBe("Buenos días"); // 11:59
    expect(greeting(new Date("2026-11-19T17:00:00Z"))).toBe("Buenas tardes"); // 12:00
    expect(greeting(new Date("2026-11-19T23:59:00Z"))).toBe("Buenas tardes"); // 18:59
    expect(greeting(new Date("2026-11-20T00:00:00Z"))).toBe("Buenas noches"); // 19:00
    expect(greeting(new Date("2026-11-19T05:00:00Z"))).toBe("Buenos días"); // 00:00
  });

  it("formatea la fecha larga con el día de la semana", () => {
    expect(formatLongDate(new Date("2026-11-19T17:00:00Z"))).toBe("Jueves, 19/11/2026");
    expect(formatLongDate(new Date("2026-11-19T03:00:00Z"))).toBe("Miércoles, 18/11/2026");
  });
});
