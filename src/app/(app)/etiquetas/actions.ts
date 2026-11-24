"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, firstIssue, uuid, type ActionResult } from "@/lib/actions";
import { syncProjectTags, syncQuickTaskTags } from "@/lib/data/tags";
import { MAX_TAG_NAME, normalizeTagName, TAG_COLORS } from "@/lib/domain/tags";
import { createClient } from "@/lib/supabase/server";

const name = z
  .string()
  .transform(normalizeTagName)
  .pipe(z.string().min(1, "Escribe el nombre de la etiqueta").max(MAX_TAG_NAME, `El nombre admite máximo ${MAX_TAG_NAME} caracteres`));
const color = z.enum(TAG_COLORS, { message: "Color inválido" });
const tagIds = z.array(uuid).max(50, "Máximo 50 etiquetas");

/** Las etiquetas se ven en Inicio, proyectos, pendientes y la búsqueda. */
function refresh() {
  revalidatePath("/", "layout");
}

const DUPLICATE = "Ya existe una etiqueta con ese nombre";

async function run<T extends ActionResult>(fn: () => Promise<T>): Promise<T | ActionResult> {
  try {
    const result = await fn();
    if (result.ok) refresh();
    return result;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "No se pudo guardar el cambio");
  }
}

const createSchema = z.object({ name, color });
export type CreateTagResult = { ok: true; id: string } | { ok: false; error: string };

export async function createTag(input: z.input<typeof createSchema>): Promise<CreateTagResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const result = await run(async (): Promise<CreateTagResult> => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("tags").insert(parsed.data).select("id").single();
    if (error) return { ok: false, error: error.code === "23505" ? DUPLICATE : error.message };
    return { ok: true, id: data.id };
  });
  return result as CreateTagResult;
}

const updateSchema = z.object({ id: uuid, name: name.optional(), color: color.optional() });

export async function updateTag(input: z.input<typeof updateSchema>): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { id, ...changes } = parsed.data;
  if (Object.keys(changes).length === 0) return { ok: true };

  return run(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("tags").update(changes).eq("id", id).select("id").maybeSingle();
    if (error) return fail(error.code === "23505" ? DUPLICATE : error.message);
    if (!data) return fail("No se encontró la etiqueta");
    return { ok: true };
  });
}

/** Elimina la etiqueta; se quita sola de los proyectos y pendientes que la tenían. */
export async function deleteTag(input: { id: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("tags").delete().eq("id", parsed.data.id);
    if (error) return fail(error.message);
    return { ok: true };
  });
}

export async function setProjectTags(input: { projectId: string; tagIds: string[] }): Promise<ActionResult> {
  const parsed = z.object({ projectId: uuid, tagIds }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data: project } = await supabase.from("projects").select("id").eq("id", parsed.data.projectId).maybeSingle();
    if (!project) return fail("No se encontró el proyecto");
    const message = await syncProjectTags(supabase, parsed.data.projectId, parsed.data.tagIds);
    return message ? fail(message) : { ok: true };
  });
}

export async function setQuickTaskTags(input: { quickTaskId: string; tagIds: string[] }): Promise<ActionResult> {
  const parsed = z.object({ quickTaskId: uuid, tagIds }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data: task } = await supabase.from("quick_tasks").select("id").eq("id", parsed.data.quickTaskId).maybeSingle();
    if (!task) return fail("No se encontró el pendiente");
    const message = await syncQuickTaskTags(supabase, parsed.data.quickTaskId, parsed.data.tagIds);
    return message ? fail(message) : { ok: true };
  });
}
