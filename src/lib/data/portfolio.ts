import { createClient } from "@/lib/supabase/server";
import type { PortfolioPhase, PortfolioProject, PortfolioTask } from "@/lib/domain/portfolio";

export async function loadPortfolioInput(): Promise<{
  projects: PortfolioProject[];
  phases: PortfolioPhase[];
  tasks: PortfolioTask[];
}> {
  const supabase = await createClient();

  const [overview, phases, tasks] = await Promise.all([
    supabase.from("project_overview").select("*"),
    supabase
      .from("phases")
      .select("id, project_id, name, position, status, estimated_date, original_date, completed_at"),
    supabase.from("tasks").select("project_id, phase_id, state, parent_task_id"),
  ]);

  const error = overview.error ?? phases.error ?? tasks.error;
  if (error) throw new Error(error.message);

  return {
    projects: (overview.data ?? []).map((r) => ({
      id: r.project_id!,
      name: r.name!,
      area: r.area,
      status: r.status!,
      updatedAt: r.updated_at!,
      resources: {
        documents: r.resources_documents ?? 0,
        flowsCode: r.resources_flows_code ?? 0,
        links: r.resources_links ?? 0,
      },
    })),
    phases: (phases.data ?? []).map((p) => ({
      id: p.id,
      projectId: p.project_id,
      name: p.name,
      position: p.position,
      status: p.status,
      estimatedDate: p.estimated_date,
      originalDate: p.original_date,
      completedAt: p.completed_at,
    })),
    tasks: (tasks.data ?? []).map((t) => ({
      projectId: t.project_id,
      phaseId: t.phase_id,
      state: t.state,
      parentTaskId: t.parent_task_id,
    })),
  };
}
