import type { MyTask } from "@/lib/domain/myTasks";
import { createClient } from "@/lib/supabase/server";

/** Tareas abiertas de primer nivel de proyectos no archivados ni entregados. */
export async function loadMyTasks(): Promise<MyTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, state, priority, due_date, estimated_hours, project_id, projects!inner(name, status, archived_at), phases(name)",
    )
    .neq("state", "done")
    .is("parent_task_id", null)
    .is("projects.archived_at", null)
    .neq("projects.status", "delivered");
  if (error) throw new Error(error.message);

  return (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    state: t.state,
    priority: t.priority,
    dueDate: t.due_date,
    estimatedHours: t.estimated_hours,
    projectId: t.project_id,
    projectName: t.projects.name,
    projectStatus: t.projects.status,
    phaseName: t.phases?.name ?? null,
  }));
}
