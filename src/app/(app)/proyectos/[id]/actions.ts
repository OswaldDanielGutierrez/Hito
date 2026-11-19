"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, firstIssue, isoDate, uuid, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/data/activity";
import { addDays, diffDays, formatDate, todayInBogota } from "@/lib/domain/dates";
import { priorityLabel, taskStateLabel } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

export type { ActionResult };

const id = uuid;
const taskState = z.enum(["pending", "in_progress", "done", "blocked"]);
const priority = z.enum(["high", "medium", "low"]);
const reason = z.string().trim().max(300, "El motivo es muy largo").optional();

function refresh() {
  revalidatePath("/proyectos/[id]", "layout");
  revalidatePath("/");
}

async function run(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    const result = await fn();
    if (result.ok) refresh();
    return result;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "No se pudo guardar el cambio");
  }
}

export async function setTaskState(input: { taskId: string; state: string }): Promise<ActionResult> {
  const parsed = z.object({ taskId: id, state: taskState }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data: task } = await supabase
      .from("tasks")
      .select("id, title, state, project_id")
      .eq("id", parsed.data.taskId)
      .maybeSingle();
    if (!task) return fail("No se encontró la tarea");
    if (task.state === parsed.data.state) return { ok: true };

    const { error } = await supabase
      .from("tasks")
      .update({ state: parsed.data.state, blocked_reason: parsed.data.state === "blocked" ? undefined : null })
      .eq("id", task.id);
    if (error) return fail(error.message);

    await logActivity(supabase, {
      projectId: task.project_id,
      kind: "task",
      entityType: "task",
      entityId: task.id,
      summary: `Estado de la tarea «${task.title}»`,
      oldValue: taskStateLabel[task.state],
      newValue: taskStateLabel[parsed.data.state],
    });
    return { ok: true };
  });
}

const updateTaskSchema = z.object({
  taskId: id,
  title: z.string().trim().min(1, "Escribe un título").max(200, "El título es muy largo"),
  description: z.string().trim().max(4000).nullable(),
  state: taskState,
  priority,
  dueDate: isoDate.nullable(),
  estimatedHours: z.number().min(0, "Las horas no pueden ser negativas").max(9999.9).nullable(),
  blockedReason: z.string().trim().max(300, "El motivo es muy largo").nullable(),
});

export async function updateTask(input: z.input<typeof updateTaskSchema>): Promise<ActionResult> {
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  return run(async () => {
    const supabase = await createClient();
    const { data: task } = await supabase.from("tasks").select("*").eq("id", v.taskId).maybeSingle();
    if (!task) return fail("No se encontró la tarea");

    const { error } = await supabase
      .from("tasks")
      .update({
        title: v.title,
        description: v.description || null,
        state: v.state,
        priority: v.priority,
        due_date: v.dueDate,
        estimated_hours: v.estimatedHours,
        blocked_reason: v.state === "blocked" ? v.blockedReason || null : null,
      })
      .eq("id", task.id);
    if (error) return fail(error.message);

    const changes: { summary: string; oldValue: string; newValue: string }[] = [];
    const label = `«${v.title}»`;
    if (task.title !== v.title) changes.push({ summary: "Título de tarea", oldValue: task.title, newValue: v.title });
    if (task.state !== v.state) {
      changes.push({
        summary: `Estado de la tarea ${label}`,
        oldValue: taskStateLabel[task.state],
        newValue: taskStateLabel[v.state],
      });
    }
    if (task.priority !== v.priority) {
      changes.push({
        summary: `Prioridad de la tarea ${label}`,
        oldValue: priorityLabel[task.priority],
        newValue: priorityLabel[v.priority],
      });
    }
    if (task.due_date !== v.dueDate) {
      changes.push({
        summary: `Fecha de la tarea ${label}`,
        oldValue: task.due_date ? formatDate(task.due_date) : "—",
        newValue: v.dueDate ? formatDate(v.dueDate) : "—",
      });
    }
    if ((task.estimated_hours ?? null) !== v.estimatedHours) {
      changes.push({
        summary: `Horas estimadas de la tarea ${label}`,
        oldValue: task.estimated_hours === null ? "—" : `${task.estimated_hours} h`,
        newValue: v.estimatedHours === null ? "—" : `${v.estimatedHours} h`,
      });
    }

    await logActivity(
      supabase,
      changes.map((c) => ({ ...c, projectId: task.project_id, kind: "task" as const, entityType: "task" as const, entityId: task.id })),
    );
    return { ok: true };
  });
}

export async function addTask(input: { phaseId: string; title: string }): Promise<ActionResult> {
  const parsed = z
    .object({ phaseId: id, title: z.string().trim().min(1, "Escribe un título").max(200, "El título es muy largo") })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data: phase } = await supabase
      .from("phases")
      .select("id, name, project_id")
      .eq("id", parsed.data.phaseId)
      .maybeSingle();
    if (!phase) return fail("No se encontró la fase");

    const { data: last } = await supabase
      .from("tasks")
      .select("position")
      .eq("phase_id", phase.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        project_id: phase.project_id,
        phase_id: phase.id,
        title: parsed.data.title,
        position: (last?.position ?? -1) + 1,
      })
      .select("id")
      .single();
    if (error) return fail(error.message);

    await logActivity(supabase, {
      projectId: phase.project_id,
      kind: "task",
      entityType: "task",
      entityId: task.id,
      summary: `Tarea agregada a la fase ${phase.name}`,
      newValue: parsed.data.title,
    });
    return { ok: true };
  });
}

export async function updatePhaseDate(input: {
  phaseId: string;
  date: string;
  reason?: string;
  shiftFollowing: boolean;
}): Promise<ActionResult> {
  const parsed = z
    .object({ phaseId: id, date: isoDate, reason, shiftFollowing: z.boolean() })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  return run(async () => {
    const supabase = await createClient();
    const { data: phase } = await supabase.from("phases").select("*").eq("id", v.phaseId).maybeSingle();
    if (!phase) return fail("No se encontró la fase");
    if (phase.estimated_date === v.date) return { ok: true };

    const { error } = await supabase.from("phases").update({ estimated_date: v.date }).eq("id", phase.id);
    if (error) return fail(error.message);

    const entries = [
      {
        projectId: phase.project_id,
        kind: "date" as const,
        entityType: "phase" as const,
        entityId: phase.id,
        summary: `Entrega estimada de la fase ${phase.name}`,
        oldValue: phase.estimated_date ? formatDate(phase.estimated_date) : "—",
        newValue: formatDate(v.date),
        reason: v.reason,
      },
    ];

    if (v.shiftFollowing && phase.estimated_date) {
      const delta = diffDays(phase.estimated_date, v.date);
      const { data: following, error: followingError } = await supabase
        .from("phases")
        .select("id, name, estimated_date")
        .eq("project_id", phase.project_id)
        .gt("position", phase.position)
        .neq("status", "completed");
      if (followingError) return fail(followingError.message);

      for (const f of following ?? []) {
        if (!f.estimated_date) continue;
        const shifted = addDays(f.estimated_date, delta);
        const { error: shiftError } = await supabase.from("phases").update({ estimated_date: shifted }).eq("id", f.id);
        if (shiftError) return fail(shiftError.message);
        entries.push({
          projectId: phase.project_id,
          kind: "date",
          entityType: "phase",
          entityId: f.id,
          summary: `Entrega estimada de la fase ${f.name}`,
          oldValue: formatDate(f.estimated_date),
          newValue: formatDate(shifted),
          reason: `Desplazada junto con la fase ${phase.name}`,
        });
      }
    }

    await logActivity(supabase, entries);
    return { ok: true };
  });
}

export async function completePhase(input: { phaseId: string }): Promise<ActionResult> {
  const parsed = z.object({ phaseId: id }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data: phase } = await supabase.from("phases").select("*").eq("id", parsed.data.phaseId).maybeSingle();
    if (!phase) return fail("No se encontró la fase");
    if (phase.status === "completed") return { ok: true };

    const { error } = await supabase
      .from("phases")
      .update({ status: "completed", completed_at: todayInBogota() })
      .eq("id", phase.id);
    if (error) return fail(error.message);

    const { data: next } = await supabase
      .from("phases")
      .select("id, name")
      .eq("project_id", phase.project_id)
      .gt("position", phase.position)
      .neq("status", "completed")
      .order("position")
      .limit(1)
      .maybeSingle();
    if (next) await supabase.from("phases").update({ status: "in_progress" }).eq("id", next.id);

    await logActivity(supabase, {
      projectId: phase.project_id,
      kind: "phase",
      entityType: "phase",
      entityId: phase.id,
      summary: `Fase ${phase.name} completada`,
      oldValue: "En curso",
      newValue: "Completada",
    });
    return { ok: true };
  });
}

export async function reopenPhase(input: { phaseId: string }): Promise<ActionResult> {
  const parsed = z.object({ phaseId: id }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data: phase } = await supabase.from("phases").select("*").eq("id", parsed.data.phaseId).maybeSingle();
    if (!phase) return fail("No se encontró la fase");
    if (phase.status !== "completed") return { ok: true };

    const { error: openError } = await supabase
      .from("phases")
      .update({ status: "in_progress", completed_at: null })
      .eq("id", phase.id);
    if (openError) return fail(openError.message);

    await supabase
      .from("phases")
      .update({ status: "pending" })
      .eq("project_id", phase.project_id)
      .gt("position", phase.position)
      .eq("status", "in_progress");

    await logActivity(supabase, {
      projectId: phase.project_id,
      kind: "phase",
      entityType: "phase",
      entityId: phase.id,
      summary: `Fase ${phase.name} reabierta`,
      oldValue: "Completada",
      newValue: "En curso",
    });
    return { ok: true };
  });
}

export async function addPhase(input: { projectId: string; name: string; date: string }): Promise<ActionResult> {
  const parsed = z
    .object({
      projectId: id,
      name: z.string().trim().min(1, "Escribe el nombre de la fase").max(80, "El nombre es muy largo"),
      date: isoDate,
    })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  return run(async () => {
    const supabase = await createClient();
    const { data: phases, error: phasesError } = await supabase
      .from("phases")
      .select("position, status")
      .eq("project_id", v.projectId);
    if (phasesError) return fail(phasesError.message);
    if (!phases) return fail("No se encontró el proyecto");

    const position = phases.reduce((max, p) => Math.max(max, p.position), 0) + 1;
    const becomesCurrent = phases.every((p) => p.status === "completed");

    const { data: phase, error } = await supabase
      .from("phases")
      .insert({
        project_id: v.projectId,
        name: v.name,
        position,
        status: becomesCurrent ? "in_progress" : "pending",
        estimated_date: v.date,
        original_date: v.date,
      })
      .select("id")
      .single();
    if (error) return fail(error.message);

    await logActivity(supabase, {
      projectId: v.projectId,
      kind: "phase",
      entityType: "phase",
      entityId: phase.id,
      summary: "Fase agregada",
      newValue: `${v.name} · ${formatDate(v.date)}`,
    });
    return { ok: true };
  });
}

export async function renamePhase(input: { phaseId: string; name: string }): Promise<ActionResult> {
  const parsed = z
    .object({ phaseId: id, name: z.string().trim().min(1, "Escribe el nombre de la fase").max(80, "El nombre es muy largo") })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data: phase } = await supabase.from("phases").select("id, name, project_id").eq("id", parsed.data.phaseId).maybeSingle();
    if (!phase) return fail("No se encontró la fase");
    if (phase.name === parsed.data.name) return { ok: true };

    const { error } = await supabase.from("phases").update({ name: parsed.data.name }).eq("id", phase.id);
    if (error) return fail(error.message);

    await logActivity(supabase, {
      projectId: phase.project_id,
      kind: "phase",
      entityType: "phase",
      entityId: phase.id,
      summary: "Fase renombrada",
      oldValue: phase.name,
      newValue: parsed.data.name,
    });
    return { ok: true };
  });
}

export async function movePhase(input: { phaseId: string; direction: "up" | "down" }): Promise<ActionResult> {
  const parsed = z.object({ phaseId: id, direction: z.enum(["up", "down"]) }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data: phase } = await supabase.from("phases").select("id, name, project_id").eq("id", parsed.data.phaseId).maybeSingle();
    if (!phase) return fail("No se encontró la fase");

    const { error } = await supabase.rpc("move_phase", { p_phase_id: phase.id, p_direction: parsed.data.direction });
    if (error) return fail(error.message);

    await logActivity(supabase, {
      projectId: phase.project_id,
      kind: "phase",
      entityType: "phase",
      entityId: phase.id,
      summary: `Orden de la fase ${phase.name}`,
      newValue: parsed.data.direction === "up" ? "Subió una posición" : "Bajó una posición",
    });
    return { ok: true };
  });
}

export async function deletePhase(input: { phaseId: string }): Promise<ActionResult> {
  const parsed = z.object({ phaseId: id }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data: phase } = await supabase.from("phases").select("*").eq("id", parsed.data.phaseId).maybeSingle();
    if (!phase) return fail("No se encontró la fase");

    const { count } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("phase_id", phase.id);

    const { error } = await supabase.from("phases").delete().eq("id", phase.id);
    if (error) return fail(error.message);

    if (phase.status === "in_progress") {
      const { data: next } = await supabase
        .from("phases")
        .select("id")
        .eq("project_id", phase.project_id)
        .neq("status", "completed")
        .order("position")
        .limit(1)
        .maybeSingle();
      if (next) await supabase.from("phases").update({ status: "in_progress" }).eq("id", next.id);
    }

    await logActivity(supabase, {
      projectId: phase.project_id,
      kind: "phase",
      entityType: "phase",
      entityId: phase.id,
      summary: "Fase eliminada",
      oldValue: phase.name,
      newValue: count ? `También se eliminaron ${count} ${count === 1 ? "tarea" : "tareas"}` : null,
    });
    return { ok: true };
  });
}

export async function deleteTask(input: { taskId: string }): Promise<ActionResult> {
  const parsed = z.object({ taskId: id }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data: task } = await supabase.from("tasks").select("id, title, project_id").eq("id", parsed.data.taskId).maybeSingle();
    if (!task) return fail("No se encontró la tarea");

    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) return fail(error.message);

    await logActivity(supabase, {
      projectId: task.project_id,
      kind: "task",
      entityType: "task",
      entityId: task.id,
      summary: "Tarea eliminada",
      oldValue: task.title,
    });
    return { ok: true };
  });
}
