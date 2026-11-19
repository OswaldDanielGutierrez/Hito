import type { ResourceKind } from "./types";

export type ResourceFilter = "all" | "document" | "flow_code" | "link";

export const RESOURCE_FILTERS: { value: ResourceFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "document", label: "Documentos" },
  { value: "flow_code", label: "Flujos y código" },
  { value: "link", label: "Enlaces" },
];

export function matchesResourceFilter(kind: ResourceKind, filter: ResourceFilter): boolean {
  if (filter === "all") return true;
  if (filter === "flow_code") return kind === "flow" || kind === "code";
  return kind === filter;
}

export function countByFilter(resources: { kind: ResourceKind }[]): Record<ResourceFilter, number> {
  return {
    all: resources.length,
    document: resources.filter((r) => matchesResourceFilter(r.kind, "document")).length,
    flow_code: resources.filter((r) => matchesResourceFilter(r.kind, "flow_code")).length,
    link: resources.filter((r) => matchesResourceFilter(r.kind, "link")).length,
  };
}
