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
  "id, title, project_id, requested_by, due_date, priority, done, done_at, created_at, projects(id, name), quick_task_tags(tag_id), quick_task_notes(count), quick_task_attachments(count), notepad_length";

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
      notesCount: t.quick_task_notes[0]?.count ?? 0,
      attachmentsCount: t.quick_task_attachments[0]?.count ?? 0,
      hasNotepad: (t.notepad_length ?? 0) > 0,
    })),
    projects: projects.data ?? [],
    requesters: [...known].sort((a, b) => (a === SELF_NAME ? -1 : b === SELF_NAME ? 1 : a.localeCompare(b, "es"))),
    ownerName: settings.data?.display_name ?? "",
    tags,
  };
}

export interface QuickTaskPageData {
  task: {
    id: string;
    title: string;
    projectId: string | null;
    projectName: string | null;
    requestedBy: string;
    dueDate: string | null;
    priority: "high" | "medium" | "low";
    done: boolean;
    doneAt: string | null;
    createdAt: string;
    notepad: string;
    tagIds: string[];
  };
  notes: { id: string; body: string; createdAt: string; updatedAt: string }[];
  attachments: { id: string; kind: "file" | "link"; name: string; url: string | null; source: string | null; createdAt: string }[];
  tags: TagWithUsage[];
  userId: string;
}

/** Todo lo que muestra la página de un pendiente. `null` si no existe o no es del usuario. */
export async function loadQuickTaskPage(id: string): Promise<QuickTaskPageData | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const supabase = await createClient();

  const [task, notes, attachments, tags, userResult] = await Promise.all([
    supabase
      .from("quick_tasks")
      .select("id, title, project_id, requested_by, due_date, priority, done, done_at, created_at, notepad, projects(id, name), quick_task_tags(tag_id)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("quick_task_notes").select("id, body, created_at, updated_at").eq("quick_task_id", id).is("section_id", null).order("created_at"),
    supabase.from("quick_task_attachments").select("id, kind, name, url, source, created_at").eq("quick_task_id", id).order("created_at"),
    loadTags(),
    supabase.auth.getUser(),
  ]);

  const error = task.error ?? notes.error ?? attachments.error;
  if (error) throw new Error(error.message);
  if (!task.data || !userResult.data.user) return null;
  const t = task.data;

  return {
    task: {
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
      notepad: t.notepad,
      tagIds: t.quick_task_tags.map((x) => x.tag_id),
    },
    notes: (notes.data ?? []).map((n) => ({ id: n.id, body: n.body, createdAt: n.created_at, updatedAt: n.updated_at })),
    attachments: (attachments.data ?? []).map((a) => ({
      id: a.id,
      kind: a.kind === "file" ? "file" : "link",
      name: a.name,
      url: a.url,
      source: a.source,
      createdAt: a.created_at,
    })),
    tags,
    userId: userResult.data.user.id,
  };
}
