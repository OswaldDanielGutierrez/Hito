import { createClient } from "@/lib/supabase/server";
import type { QuickTask } from "@/lib/domain/pendientes";
import { SELF_NAME } from "@/lib/domain/pendientes";
import type { TagWithUsage } from "@/lib/domain/tags";
import { loadTags } from "@/lib/data/tags";

export interface PendientesData {
  tasks: QuickTask[];
  projects: { id: string; name: string }[];
  requesters: string[];
  ownerName: string;
  tags: TagWithUsage[];
}

const COLUMNS =
  "id, title, project_id, requested_by, due_date, priority, done, done_at, created_at, projects(id, name), quick_task_tags(tag_id), quick_task_sections(count), quick_task_notes(count)";

/**
 * Todos los pendientes: nada se oculta ni se borra con el tiempo. La pantalla decide cuáles
 * se ven arriba (abiertos y hechos de hoy) y cuáles van a «Hechos anteriores».
 * PostgREST entrega máximo 1000 filas por consulta; se piden por separado abiertos y hechos.
 */
export async function loadPendientes(): Promise<PendientesData> {
  const supabase = await createClient();

  const [open, done, projects, requesters, settings, tags] = await Promise.all([
    supabase.from("quick_tasks").select(COLUMNS).eq("done", false).order("created_at", { ascending: false }).limit(1000),
    supabase.from("quick_tasks").select(COLUMNS).eq("done", true).order("done_at", { ascending: false, nullsFirst: false }).limit(1000),
    supabase.from("projects").select("id, name").is("archived_at", null).neq("status", "delivered").order("name"),
    supabase.from("quick_tasks").select("requested_by").limit(1000),
    supabase.from("user_settings").select("display_name").maybeSingle(),
    loadTags(),
  ]);

  const error = open.error ?? done.error ?? projects.error ?? requesters.error ?? settings.error;
  if (error) throw new Error(error.message);

  const known = new Set<string>([SELF_NAME]);
  for (const r of requesters.data ?? []) known.add(r.requested_by);

  const rows = [...(open.data ?? []), ...(done.data ?? [])];

  return {
    tasks: rows.map((t) => ({
      id: t.id,
      title: t.title,
      projectId: t.project_id,
      projectName: t.projects?.name ?? null,
      requestedBy: t.requested_by,
      dueDate: t.due_date,
      priority: t.priority,
      done: t.done,
      doneAt: t.done_at,
      createdAt: t.created_at,
      tagIds: t.quick_task_tags.map((x) => x.tag_id),
      sectionsCount: t.quick_task_sections[0]?.count ?? 0,
      notesCount: t.quick_task_notes[0]?.count ?? 0,
    })),
    projects: projects.data ?? [],
    requesters: [...known].sort((a, b) => (a === SELF_NAME ? -1 : b === SELF_NAME ? 1 : a.localeCompare(b, "es"))),
    ownerName: settings.data?.display_name ?? "",
    tags,
  };
}
