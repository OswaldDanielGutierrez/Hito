import { describe, expect, it } from "vitest";
import { countByFilter, matchesResourceFilter } from "./resourceFilters";

describe("filtros de recursos", () => {
  it("'Flujos y código' agrupa flow y code", () => {
    expect(matchesResourceFilter("flow", "flow_code")).toBe(true);
    expect(matchesResourceFilter("code", "flow_code")).toBe(true);
    expect(matchesResourceFilter("document", "flow_code")).toBe(false);
  });

  it("'Todos' acepta cualquier tipo y los demás filtran por su tipo", () => {
    expect(matchesResourceFilter("link", "all")).toBe(true);
    expect(matchesResourceFilter("link", "link")).toBe(true);
    expect(matchesResourceFilter("link", "document")).toBe(false);
  });

  it("cuenta por filtro", () => {
    const resources = [{ kind: "document" as const }, { kind: "flow" as const }, { kind: "code" as const }, { kind: "link" as const }, { kind: "link" as const }];
    expect(countByFilter(resources)).toEqual({ all: 5, document: 1, flow_code: 2, link: 2 });
  });
});
