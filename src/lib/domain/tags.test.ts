import { describe, expect, it } from "vitest";
import {
  findDuplicate,
  normalizeTagName,
  sortTags,
  suggestColor,
  tagKey,
  tagsFromIds,
  toggleId,
  toTagColor,
  usageText,
  validateTagName,
  type Tag,
} from "./tags";

const tag = (id: string, name: string, color: Tag["color"] = "green"): Tag => ({ id, name, color });

describe("normalizeTagName / tagKey", () => {
  it("quita espacios sobrantes", () => {
    expect(normalizeTagName("  Power   Apps ")).toBe("Power Apps");
  });
  it("compara sin mayúsculas ni tildes", () => {
    expect(tagKey(" Automatización ")).toBe(tagKey("automatizacion"));
    expect(tagKey("Power  Apps")).toBe("power apps");
  });
});

describe("validateTagName", () => {
  const tags = [tag("1", "Power Apps"), tag("2", "Power Automate")];
  it("rechaza vacío", () => {
    expect(validateTagName(tags, "   ")).toBe("Escribe el nombre de la etiqueta");
  });
  it("rechaza nombres largos", () => {
    expect(validateTagName(tags, "x".repeat(31))).toMatch(/máximo 30/);
    expect(validateTagName(tags, "x".repeat(30))).toBeNull();
  });
  it("rechaza duplicados sin importar mayúsculas", () => {
    expect(validateTagName(tags, "power apps")).toBe("Ya existe una etiqueta con ese nombre");
  });
  it("permite conservar el propio nombre al editar", () => {
    expect(validateTagName(tags, "POWER APPS", "1")).toBeNull();
    expect(findDuplicate(tags, "Power Apps", "1")).toBeUndefined();
  });
});

describe("suggestColor", () => {
  it("sugiere verde sin etiquetas", () => {
    expect(suggestColor([])).toBe("green");
  });
  it("elige un color poco usado", () => {
    expect(suggestColor([tag("1", "a", "green"), tag("2", "b", "green"), tag("3", "c", "blue")])).toBe("amber");
  });
});

describe("tagsFromIds / sortTags / toggleId", () => {
  const all = [tag("1", "Zeta"), tag("2", "álgebra"), tag("3", "Beta")];
  it("ordena por nombre en español", () => {
    expect(sortTags(all).map((t) => t.name)).toEqual(["álgebra", "Beta", "Zeta"]);
  });
  it("ignora ids que ya no existen", () => {
    expect(tagsFromIds(["3", "9", "1"], all).map((t) => t.id)).toEqual(["3", "1"]);
  });
  it("agrega y quita ids", () => {
    expect(toggleId(["1"], "2")).toEqual(["1", "2"]);
    expect(toggleId(["1", "2"], "1")).toEqual(["2"]);
  });
});

describe("toTagColor / usageText", () => {
  it("usa gris si el color no es válido", () => {
    expect(toTagColor("fucsia")).toBe("gray");
    expect(toTagColor("pink")).toBe("pink");
  });
  it("describe el uso", () => {
    expect(usageText({ projects: 0, quickTasks: 0 })).toBe("No está en uso");
    expect(usageText({ projects: 1, quickTasks: 0 })).toBe("Está en 1 proyecto");
    expect(usageText({ projects: 2, quickTasks: 3 })).toBe("Está en 2 proyectos y 3 pendientes");
  });
});
