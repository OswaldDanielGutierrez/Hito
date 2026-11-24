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

/**
 * Pendientes abiertos, más los hechos hoy (Bogotá) o con fecha de hoy en adelante.
 * Los demás hechos quedan fuera (el historial de pendientes es v2).
 */
export async function loadPendientes(today: string): Promise<PendientesData> {
  const supabase = await createClient();
  const startOfToday = new Date(`${today}T00:00:00-05:00`).toISOString();

  const [tasks, projects, requesters, settings, tags] = await Promise.all([
    supabase
      .from("quick_tasks")
      .select("id, title, project_id, requested_by, due_date, priority, done, done_at, created_at, projects(id, name), quick_task_tags(tag_id)")
      .or(`done.eq.false,done_at.gte.${startOfToday},due_date.gte.${today}`)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("projects")
      .select("id, name")
      .is("archived_at", null)
      .neq("status", "delivered")
      .order("name"),
    supabase.from("quick_tasks").select("requested_by").limit(1000),
    supabase.from("user_settings").select("display_name").maybeSingle(),
    loadTags(),
  ]);

  const error = tasks.error ?? projects.error ?? requesters.error ?? settings.error;
  if (error) throw new Error(error.message);

  const known = new Set<string>([SELF_NAME]);
  for (const r of requesters.data ?? []) known.add(r.requested_by);

  return {
    tasks: (tasks.data ?? []).map((t) => ({
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
    })),
    projects: projects.data ?? [],
    requesters: [...known].sort((a, b) => (a === SELF_NAME ? -1 : b === SELF_NAME ? 1 : a.localeCompare(b, "es"))),
    ownerName: settings.data?.display_name ?? "",
    tags,
  };
}
