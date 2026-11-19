import { describe, expect, it } from "vitest";
import {
  dayCounts,
  dueLabel,
  fridayOfWeek,
  getSection,
  groupBySection,
  initials,
  matchesDayFilter,
  personColor,
  progressToday,
  projectColor,
  requesterAvatar,
  sortInSection,
  tallyByProject,
  tallyByRequester,
  visibleDone,
  type QuickTask,
} from "./pendientes";

// Miércoles 18/11/2026. Semana: lunes 16 – domingo 22.
const TODAY = "2026-11-18";
const TODAY_NOON = "2026-11-18T17:00:00Z"; // 12:00 en Bogotá

const task = (over: Partial<QuickTask> = {}): QuickTask => ({
  id: "t",
  title: "Pendiente",
  projectId: null,
  projectName: null,
  requestedBy: "Yo",
  dueDate: null,
  priority: "medium",
  done: false,
  doneAt: null,
  createdAt: "2026-11-18T14:00:00Z",
  ...over,
});

describe("getSection", () => {
  it("clasifica por fecha", () => {
    expect(getSection(task({ dueDate: "2026-11-17" }), TODAY)).toBe("overdue");
    expect(getSection(task({ dueDate: "2026-11-18" }), TODAY)).toBe("today");
    expect(getSection(task({ dueDate: "2026-11-19" }), TODAY)).toBe("tomorrow");
    expect(getSection(task({ dueDate: "2026-11-20" }), TODAY)).toBe("week");
    expect(getSection(task({ dueDate: "2026-11-22" }), TODAY)).toBe("week");
    expect(getSection(task({ dueDate: "2026-11-23" }), TODAY)).toBe("nextWeek");
    expect(getSection(task({ dueDate: "2027-02-01" }), TODAY)).toBe("nextWeek");
    expect(getSection(task({ dueDate: null }), TODAY)).toBe("none");
  });

  it("un hecho con fecha pasada va a Hoy, no a Atrasados", () => {
    expect(getSection(task({ dueDate: "2026-11-10", done: true }), TODAY)).toBe("today");
  });

  it("el domingo desde el viernes es Esta semana; desde el sábado es Mañana", () => {
    expect(getSection(task({ dueDate: "2026-11-22" }), "2026-11-20")).toBe("week"); // viernes
    expect(getSection(task({ dueDate: "2026-11-22" }), "2026-11-21")).toBe("tomorrow"); // sábado
  });
});

describe("dueLabel", () => {
  it("atrasado 1 y 2 días", () => {
    expect(dueLabel(task({ dueDate: "2026-11-17" }), TODAY)).toEqual({
      text: "Ayer 17/11 · 1 día tarde",
      bg: "#FDECEA",
      ink: "#B42318",
    });
    expect(dueLabel(task({ dueDate: "2026-11-16" }), TODAY).text).toBe("Lun 16/11 · 2 días tarde");
    expect(dueLabel(task({ dueDate: "2026-11-15" }), "2026-11-17").text).toBe("Dom 15/11 · 2 días tarde");
  });

  it("hoy, mañana, más adelante y sin fecha", () => {
    expect(dueLabel(task({ dueDate: TODAY }), TODAY)).toEqual({ text: "Hoy", bg: "#FDF0E3", ink: "#8A4A0B" });
    expect(dueLabel(task({ dueDate: "2026-11-19" }), TODAY)).toEqual({ text: "Mañana", bg: "#EEF2F0", ink: "#58635D" });
    expect(dueLabel(task({ dueDate: "2026-11-20" }), TODAY).text).toBe("Vie 20/11");
    expect(dueLabel(task({ dueDate: "2026-11-23" }), TODAY).text).toBe("Lun 23/11");
    expect(dueLabel(task({ dueDate: null }), TODAY).text).toBe("Sin fecha");
  });

  it("un hecho con fecha pasada no se pinta de atrasado", () => {
    expect(dueLabel(task({ dueDate: "2026-11-16", done: true }), TODAY)).toEqual({ text: "Lun 16/11", bg: "#EEF2F0", ink: "#58635D" });
  });

  it("los martes se abrevian 'Mar'", () => {
    expect(dueLabel(task({ dueDate: "2026-11-17" }), "2026-11-19").text).toBe("Mar 17/11 · 2 días tarde");
  });
});

describe("fridayOfWeek", () => {
  it("de lunes a jueves es el viernes de esta semana", () => {
    expect(fridayOfWeek("2026-11-16")).toBe("2026-11-20"); // lunes
    expect(fridayOfWeek("2026-11-18")).toBe("2026-11-20"); // miércoles
    expect(fridayOfWeek("2026-11-19")).toBe("2026-11-20"); // jueves
  });

  it("viernes, sábado y domingo apuntan al viernes siguiente", () => {
    expect(fridayOfWeek("2026-11-20")).toBe("2026-11-27");
    expect(fridayOfWeek("2026-11-21")).toBe("2026-11-27");
    expect(fridayOfWeek("2026-11-22")).toBe("2026-11-27");
  });
});

describe("visibleDone", () => {
  it("los abiertos siempre se ven", () => {
    expect(visibleDone(task({ dueDate: "2026-01-01" }), TODAY)).toBe(true);
  });

  it("un hecho hoy se ve, aunque la fecha sea pasada", () => {
    expect(visibleDone(task({ done: true, doneAt: TODAY_NOON, dueDate: "2026-11-10" }), TODAY)).toBe(true);
  });

  it("un hecho ayer, sin fecha futura, se oculta", () => {
    expect(visibleDone(task({ done: true, doneAt: "2026-11-17T15:00:00Z", dueDate: "2026-11-17" }), TODAY)).toBe(false);
    expect(visibleDone(task({ done: true, doneAt: "2026-11-17T15:00:00Z", dueDate: null }), TODAY)).toBe(false);
  });

  it("un hecho ayer con fecha de hoy o posterior se ve", () => {
    expect(visibleDone(task({ done: true, doneAt: "2026-11-17T15:00:00Z", dueDate: "2026-11-18" }), TODAY)).toBe(true);
  });

  it("usa la hora de Bogotá: las 22:00 del día anterior en UTC ya son de hoy", () => {
    expect(visibleDone(task({ done: true, doneAt: "2026-11-19T03:00:00Z" }), TODAY)).toBe(true);
    expect(visibleDone(task({ done: true, doneAt: "2026-11-18T04:00:00Z" }), TODAY)).toBe(false); // 23:00 del 17
  });
});

describe("sortInSection", () => {
  it("abiertos antes que hechos, alta antes que normal y más reciente primero", () => {
    const sorted = sortInSection([
      task({ id: "hecha", done: true, doneAt: TODAY_NOON }),
      task({ id: "vieja", createdAt: "2026-11-18T10:00:00Z" }),
      task({ id: "nueva", createdAt: "2026-11-18T16:00:00Z" }),
      task({ id: "alta-vieja", priority: "high", createdAt: "2026-11-18T09:00:00Z" }),
      task({ id: "alta-nueva", priority: "high", createdAt: "2026-11-18T15:00:00Z" }),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["alta-nueva", "alta-vieja", "nueva", "vieja", "hecha"]);
  });
});

describe("groupBySection", () => {
  const groups = groupBySection(
    [
      task({ id: "a", dueDate: "2026-11-17" }),
      task({ id: "b", dueDate: TODAY }),
      task({ id: "c", dueDate: TODAY, done: true, doneAt: TODAY_NOON }),
      task({ id: "d", dueDate: "2026-11-19" }),
      task({ id: "e", dueDate: "2026-11-20" }),
      task({ id: "f", dueDate: "2026-11-23" }),
      task({ id: "g" }),
      task({ id: "oculto", done: true, doneAt: "2026-11-17T15:00:00Z", dueDate: "2026-11-17" }),
    ],
    TODAY,
  );

  it("devuelve las 6 secciones en orden con sus rangos", () => {
    expect(groups.map((g) => g.key)).toEqual(["overdue", "today", "tomorrow", "week", "nextWeek", "none"]);
    expect(groups.map((g) => g.range)).toEqual([null, "Mié 18/11", "Jue 19/11", "Vie 20/11 – Dom 22/11", "Desde Lun 23/11", null]);
  });

  it("reparte y cuenta abiertos, y omite los hechos antiguos", () => {
    const by = (key: string) => groups.find((g) => g.key === key)!;
    expect(by("overdue").tasks.map((t) => t.id)).toEqual(["a"]);
    expect(by("today").tasks.map((t) => t.id)).toEqual(["b", "c"]);
    expect(by("today").openCount).toBe(1);
    expect(groups.flatMap((g) => g.tasks).some((t) => t.id === "oculto")).toBe(false);
  });

  it("sin días entre mañana y el domingo no hay rango de Esta semana", () => {
    expect(groupBySection([], "2026-11-21").find((g) => g.key === "week")!.range).toBeNull();
  });
});

describe("pastillas de día", () => {
  const tasks = [
    task({ id: "1", dueDate: "2026-11-16" }),
    task({ id: "2", dueDate: TODAY }),
    task({ id: "3", dueDate: "2026-11-19" }),
    task({ id: "4", dueDate: "2026-11-20" }),
    task({ id: "5", dueDate: "2026-11-24" }),
    task({ id: "6" }),
    task({ id: "7", dueDate: TODAY, done: true, doneAt: TODAY_NOON }),
  ];

  it("cuenta solo abiertos", () => {
    expect(dayCounts(tasks, TODAY)).toEqual({ all: 6, today: 2, tomorrow: 1, upcoming: 2, none: 1 });
  });

  it("Hoy incluye atrasados y Próximos incluye esta semana y la próxima", () => {
    expect(matchesDayFilter("overdue", "today")).toBe(true);
    expect(matchesDayFilter("today", "today")).toBe(true);
    expect(matchesDayFilter("tomorrow", "today")).toBe(false);
    expect(matchesDayFilter("week", "upcoming")).toBe(true);
    expect(matchesDayFilter("nextWeek", "upcoming")).toBe(true);
    expect(matchesDayFilter("none", "all")).toBe(true);
  });
});

describe("progressToday", () => {
  it("total = abiertos atrasados o de hoy + hechos hoy", () => {
    const p = progressToday(
      [
        task({ dueDate: "2026-11-17" }),
        task({ dueDate: TODAY }),
        task({ dueDate: TODAY }),
        task({ dueDate: TODAY, done: true, doneAt: TODAY_NOON }),
        task({ dueDate: "2026-11-20" }),
        task({ done: true, doneAt: "2026-11-17T15:00:00Z", dueDate: "2026-11-18" }),
        task({}),
      ],
      TODAY,
    );
    expect(p).toEqual({ done: 1, total: 4, remaining: 3, cells: ["done", "overdue", "open", "open"] });
  });

  it("día completo cuando no queda nada por terminar", () => {
    const p = progressToday([task({ dueDate: TODAY, done: true, doneAt: TODAY_NOON })], TODAY);
    expect(p).toMatchObject({ done: 1, total: 1, remaining: 0 });
  });

  it("sin pendientes de hoy el total es 0", () => {
    expect(progressToday([task({ dueDate: "2026-11-25" })], TODAY)).toEqual({ done: 0, total: 0, remaining: 0, cells: [] });
  });
});

describe("paneles laterales", () => {
  const tasks = [
    task({ requestedBy: "Laura P.", projectId: "p1", projectName: "Portal" }),
    task({ requestedBy: "Laura P.", projectId: "p1", projectName: "Portal" }),
    task({ requestedBy: "Yo" }),
    task({ requestedBy: "Andrés R.", projectId: "p2", projectName: "Cartera" }),
    task({ requestedBy: "Andrés R.", done: true, doneAt: TODAY_NOON }),
  ];

  it("cuenta abiertos por solicitante de mayor a menor", () => {
    expect(tallyByRequester(tasks)).toEqual([
      { key: "Laura P.", label: "Laura P.", count: 2 },
      { key: "Andrés R.", label: "Andrés R.", count: 1 },
      { key: "Yo", label: "Yo", count: 1 },
    ]);
  });

  it("cuenta abiertos por proyecto e incluye Sin proyecto", () => {
    expect(tallyByProject(tasks).map((t) => [t.label, t.count])).toEqual([
      ["Portal", 2],
      ["Cartera", 1],
      ["Sin proyecto", 1],
    ]);
  });
});

describe("colores", () => {
  it("el color de proyecto es estable y sale de la paleta de 8", () => {
    const palette = ["#00A859", "#D9822B", "#2F6FC4", "#04512A", "#5FD597", "#9AA49F", "#1D4F91", "#8A4A0B"];
    expect(projectColor("abc")).toBe(projectColor("abc"));
    expect(palette).toContain(projectColor("e52678e5-a53b-45a8-b50e-74a39fa71890"));
    // "a" = 97, 97 % 8 = 1
    expect(projectColor("a")).toBe("#D9822B");
  });

  it("Yo es oscuro y los demás dependen de la suma de caracteres módulo 5", () => {
    expect(personColor("Yo")).toEqual({ bg: "#022C17", ink: "#FFFFFF" });
    // "A" = 65, 65 % 5 = 0
    expect(personColor("A")).toEqual({ bg: "#E6F0FB", ink: "#1D4F91" });
    // "B" = 66, 66 % 5 = 1
    expect(personColor("B")).toEqual({ bg: "#FDF0E3", ink: "#8A4A0B" });
    expect(personColor("Laura P.")).toEqual(personColor("Laura P."));
  });
});

describe("iniciales", () => {
  it("dos letras: primera del nombre y primera del apellido", () => {
    expect(initials("Laura P.")).toBe("LP");
    expect(initials("Andrés Ramírez")).toBe("AR");
    expect(initials("Oswald Gutiérrez")).toBe("OG");
  });

  it("con una sola palabra usa sus dos primeras letras", () => {
    expect(initials("Yo")).toBe("YO");
    expect(initials("Oswald")).toBe("OS");
  });

  it("'Yo' muestra las iniciales del dueño", () => {
    expect(requesterAvatar("Yo", "Oswald Gutiérrez")).toEqual({ initials: "OG", bg: "#022C17", ink: "#FFFFFF" });
    expect(requesterAvatar("Yo", "")).toMatchObject({ initials: "YO" });
    expect(requesterAvatar("Laura P.", "Oswald")).toMatchObject({ initials: "LP" });
  });
});
