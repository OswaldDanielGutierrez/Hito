"use server";

import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  type: "project" | "task" | "resource";
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

const LIMIT = 6;

/** Escapa los comodines de LIKE y los separadores del filtro `or` de PostgREST. */
function toPattern(query: string) {
  return `%${query.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/[,()]/g, " ")}%`;
}

export async function searchAll(input: { query: string }): Promise<SearchResult[]> {
  const query = String(input.query ?? "").trim().slice(0, 80);
  if (query.length < 2) return [];
  const pattern = toPattern(query);

  const supabase = await createClient();
  const [projects, tasks, resources] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, area")
      .is("archived_at", null)
      .or(`name.ilike.${pattern},area.ilike.${pattern}`)
      .limit(LIMIT),
    supabase
      .from("tasks")
      .select("id, title, project_id, projects!inner(name, archived_at)")
      .ilike("title", pattern)
      .is("projects.archived_at", null)
      .limit(LIMIT),
    supabase
      .from("resources")
      .select("id, name, source, project_id, projects!inner(name, archived_at)")
      .ilike("name", pattern)
      .is("projects.archived_at", null)
      .limit(LIMIT),
  ]);

  return [
    ...(projects.data ?? []).map((p): SearchResult => ({
      type: "project",
      id: p.id,
      title: p.name,
      subtitle: p.area,
      href: `/proyectos/${p.id}`,
    })),
    ...(tasks.data ?? []).map((t): SearchResult => ({
      type: "task",
      id: t.id,
      title: t.title,
      subtitle: t.projects.name,
      href: `/proyectos/${t.project_id}/fases`,
    })),
    ...(resources.data ?? []).map((r): SearchResult => ({
      type: "resource",
      id: r.id,
      title: r.name,
      subtitle: [r.projects.name, r.source].filter(Boolean).join(" · "),
      href: `/proyectos/${r.project_id}/recursos`,
    })),
  ];
}
