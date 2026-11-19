import { describe, expect, it } from "vitest";
import { groupMyTasks, type MyTask } from "./myTasks";

// Miércoles 18/11/2026: la semana va del 16/11 al 22/11.
const TODAY = "2026-11-18";

const task = (id: string, over: Partial<MyTask> = {}): MyTask => ({
  id,
  title: `Tarea ${id}`,
  state: "pending",
  priority: "medium",
  dueDate: null,
  estimatedHours: null,
  projectId: "p1",
  projectName: "Proyecto",
  projectStatus: "development",
  phaseName: null,
  ...over,
});

const ids = (groups: ReturnType<typeof groupMyTasks>, key: string) => groups.find((g) => g.key === key)!.tasks.map((t) => t.id);

describe("groupMyTasks", () => {
  const groups = groupMyTasks(
    [
      task("vencida", { dueDate: "2026-11-15" }),
      task("hoy", { dueDate: "2026-11-18" }),
      task("manana", { dueDate: "2026-11-19" }),
      task("domingo", { dueDate: "2026-11-22" }),
      task("lunes", { dueDate: "2026-11-23" }),
      task("sinFecha"),
      task("hecha", { dueDate: "2026-11-18", state: "done" }),
    ],
    TODAY,
  );

  it("separa por urgencia", () => {
    expect(ids(groups, "overdue")).toEqual(["vencida"]);
    expect(ids(groups, "today")).toEqual(["hoy"]);
    expect(ids(groups, "week")).toEqual(["manana", "domingo"]);
    expect(ids(groups, "later")).toEqual(["lunes"]);
    expect(ids(groups, "nodate")).toEqual(["sinFecha"]);
  });

  it("excluye las tareas hechas", () => {
    expect(groups.flatMap((g) => g.tasks).some((t) => t.id === "hecha")).toBe(false);
  });

  it("devuelve siempre los 5 grupos en orden de urgencia", () => {
    expect(groups.map((g) => g.key)).toEqual(["overdue", "today", "week", "later", "nodate"]);
    expect(groupMyTasks([], TODAY).every((g) => g.tasks.length === 0)).toBe(true);
  });

  it("ordena por fecha, luego prioridad y luego título", () => {
    const result = groupMyTasks(
      [
        task("c", { dueDate: "2026-11-19", priority: "low", title: "C" }),
        task("b", { dueDate: "2026-11-19", priority: "high", title: "B" }),
        task("a", { dueDate: "2026-11-19", priority: "high", title: "A" }),
        task("z", { dueDate: "2026-11-20", priority: "high", title: "Z" }),
      ],
      TODAY,
    );
    expect(ids(result, "week")).toEqual(["a", "b", "c", "z"]);
  });
});
