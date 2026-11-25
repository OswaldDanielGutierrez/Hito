"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, firstIssue, isoDate, uuid, type ActionResult } from "@/lib/actions";
import { syncQuickTaskTags } from "@/lib/data/tags";
import { SELF_NAME, type QuickPriority } from "@/lib/domain/pendientes";
import { createClient } from "@/lib/supabase/server";

const title = z.string().trim().min(1, "Escribe el pendiente").max(200, "El título es muy largo");
const requestedBy = z
  .string()
  .trim()
  .max(80, "El nombre de quien lo pidió es muy largo")
  .transform((v) => v || SELF_NAME);
const priority = z.enum(["high", "medium"]);
const tagIds = z.array(uuid).max(50, "Máximo 50 etiquetas");

function refresh() {
  revalidatePath("/pendientes");
}

async function run<T extends ActionResult>(fn: () => Promise<T>): Promise<T | ActionResult> {
  try {
    const result = await fn();
    if (result.ok) refresh();
    return result;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "No se pudo guardar el cambio");
  }
}

/** Verifica (con RLS) que el proyecto exista y sea del usuario. */
async function projectExists(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string | null) {
  if (!projectId) return true;
  const { data } = await supabase.from("projects").select("id").eq("id", projectId).maybeSingle();
  return !!data;
}

const createSchema = z.object({
  title,
  projectId: uuid.nullable(),
  requestedBy,
  dueDate: isoDate.nullable(),
  priority,
  tagIds: tagIds.default([]),
});

export type CreateQuickTaskResult = { ok: true; id: string } | { ok: false; error: string };

export async function createQuickTask(input: z.input<typeof createSchema>): Promise<CreateQuickTaskResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const v = parsed.data;

  const result = await run(async (): Promise<CreateQuickTaskResult> => {
    const supabase = await createClient();
    if (!(await projectExists(supabase, v.projectId))) return { ok: false, error: "No se encontró el proyecto" };

    const { data, error } = await supabase
      .from("quick_tasks")
      .insert({ title: v.title, project_id: v.projectId, requested_by: v.requestedBy, due_date: v.dueDate, priority: v.priority })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    if (v.tagIds.length > 0) {
      const message = await syncQuickTaskTags(supabase, data.id, v.tagIds);
      if (message) return { ok: false, error: message };
    }
    return { ok: true, id: data.id };
  });
  return result as CreateQuickTaskResult;
}

export async function toggleQuickTask(input: { id: string; done: boolean }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, done: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("quick_tasks").update({ done: parsed.data.done }).eq("id", parsed.data.id).select("id").maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("No se encontró el pendiente");
    return { ok: true };
  });
}

const updateSchema = z.object({
  id: uuid,
  title: title.optional(),
  projectId: uuid.nullable().optional(),
  requestedBy: requestedBy.optional(),
  dueDate: isoDate.nullable().optional(),
  priority: priority.optional(),
  tagIds: tagIds.optional(),
});

export async function updateQuickTask(input: z.input<typeof updateSchema>): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  return run(async () => {
    const supabase = await createClient();
    if (v.projectId !== undefined && !(await projectExists(supabase, v.projectId))) return fail("No se encontró el proyecto");

    const changes = {
      ...(v.title !== undefined && { title: v.title }),
      ...(v.projectId !== undefined && { project_id: v.projectId }),
      ...(v.requestedBy !== undefined && { requested_by: v.requestedBy }),
      ...(v.dueDate !== undefined && { due_date: v.dueDate }),
      ...(v.priority !== undefined && { priority: v.priority }),
    };
    if (Object.keys(changes).length > 0) {
      const { data, error } = await supabase.from("quick_tasks").update(changes).eq("id", v.id).select("id").maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail("No se encontró el pendiente");
    }
    if (v.tagIds !== undefined) {
      const message = await syncQuickTaskTags(supabase, v.id, v.tagIds);
      if (message) return fail(message);
    }
    return { ok: true };
  });
}

export async function deleteQuickTask(input: { id: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    // Los archivos adjuntos viven en Storage: se borran junto con el pendiente.
    const { data: files } = await supabase.from("quick_task_attachments").select("storage_path").eq("quick_task_id", parsed.data.id);
    const { error } = await supabase.from("quick_tasks").delete().eq("id", parsed.data.id);
    if (error) return fail(error.message);
    const paths = (files ?? []).map((f) => f.storage_path).filter((p): p is string => !!p);
    if (paths.length > 0) await supabase.storage.from("project-files").remove(paths);
    return { ok: true };
  });
}

const restoreSchema = z.object({
  id: uuid,
  title,
  projectId: uuid.nullable(),
  requestedBy,
  dueDate: isoDate.nullable(),
  priority: z.enum(["high", "medium", "low"]),
  done: z.boolean(),
  createdAt: z.string(),
  tagIds: tagIds.default([]),
});

/** Deshacer una eliminación: vuelve a crear el pendiente con el mismo id y fecha de creación. */
export async function restoreQuickTask(input: z.input<typeof restoreSchema>): Promise<ActionResult> {
  const parsed = restoreSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  return run(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("quick_tasks").insert({
      id: v.id,
      title: v.title,
      project_id: (await projectExists(supabase, v.projectId)) ? v.projectId : null,
      requested_by: v.requestedBy,
      due_date: v.dueDate,
      priority: v.priority as QuickPriority,
      done: v.done,
      created_at: v.createdAt,
    });
    if (error) return fail(error.message);
    // Las etiquetas que ya no existan se omiten: lo importante es recuperar el pendiente.
    if (v.tagIds.length > 0) {
      const { data: existing } = await supabase.from("tags").select("id").in("id", v.tagIds);
      await syncQuickTaskTags(supabase, v.id, (existing ?? []).map((t) => t.id));
    }
    return { ok: true };
  });
}
