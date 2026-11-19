"use server";

import { z } from "zod";
import { fail, firstIssue, runAction, uuid, type ActionResult } from "@/lib/actions";
import { detectFileKind, detectResource, normalizeUrl, suggestResourceName } from "@/lib/domain/resourceDetect";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "project-files";
const name160 = z.string().trim().max(160, "El nombre es muy largo");
const phaseId = uuid.nullable();

async function assertProject(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id").eq("id", projectId).maybeSingle();
  return data ? supabase : null;
}

async function assertPhase(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string, id: string | null) {
  if (!id) return true;
  const { data } = await supabase.from("phases").select("id").eq("id", id).eq("project_id", projectId).maybeSingle();
  return !!data;
}

export async function addLinkResource(input: {
  projectId: string;
  url: string;
  name?: string;
  phaseId?: string | null;
}): Promise<ActionResult> {
  const parsed = z
    .object({ projectId: uuid, url: z.string().trim().min(1, "Pega un enlace"), name: name160.optional(), phaseId: phaseId.optional() })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  const href = normalizeUrl(v.url);
  const detected = detectResource(v.url);
  if (!href || !detected) return fail("Escribe un enlace web válido, por ejemplo https://github.com/…");

  return runAction(async () => {
    const supabase = await assertProject(v.projectId);
    if (!supabase) return fail("No se encontró el proyecto");
    if (!(await assertPhase(supabase, v.projectId, v.phaseId ?? null))) return fail("No se encontró la fase");

    const { error } = await supabase.from("resources").insert({
      project_id: v.projectId,
      phase_id: v.phaseId ?? null,
      kind: detected.kind,
      name: v.name?.trim() || suggestResourceName(href) || detected.origin,
      url: href,
      source: detected.origin,
    });
    if (error) return fail(error.message);
    return { ok: true };
  });
}

export async function addFileResource(input: {
  projectId: string;
  storagePath: string;
  name: string;
  phaseId?: string | null;
}): Promise<ActionResult> {
  const parsed = z
    .object({ projectId: uuid, storagePath: z.string().min(1), name: name160.min(1, "El archivo necesita un nombre"), phaseId: phaseId.optional() })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  return runAction(async () => {
    const supabase = await assertProject(v.projectId);
    if (!supabase) return fail("No se encontró el proyecto");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const prefix = `${user?.id}/${v.projectId}/`;
    if (!user || !v.storagePath.startsWith(prefix) || v.storagePath.includes("..")) return fail("Ruta de archivo no válida");
    if (!(await assertPhase(supabase, v.projectId, v.phaseId ?? null))) return fail("No se encontró la fase");

    const { error } = await supabase.from("resources").insert({
      project_id: v.projectId,
      phase_id: v.phaseId ?? null,
      kind: detectFileKind(v.name),
      name: v.name,
      storage_path: v.storagePath,
      source: "Archivo",
    });
    if (error) {
      await supabase.storage.from(BUCKET).remove([v.storagePath]);
      return fail(error.message);
    }
    return { ok: true };
  });
}

export async function updateResource(input: {
  resourceId: string;
  name: string;
  url?: string;
  phaseId: string | null;
}): Promise<ActionResult> {
  const parsed = z
    .object({ resourceId: uuid, name: name160.min(1, "Escribe un nombre"), url: z.string().trim().optional(), phaseId })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  return runAction(async () => {
    const supabase = await createClient();
    const { data: resource } = await supabase.from("resources").select("id, project_id, storage_path").eq("id", v.resourceId).maybeSingle();
    if (!resource) return fail("No se encontró el recurso");
    if (!(await assertPhase(supabase, resource.project_id, v.phaseId))) return fail("No se encontró la fase");

    const update: { name: string; phase_id: string | null; url?: string; kind?: "document" | "flow" | "code" | "link"; source?: string } = {
      name: v.name,
      phase_id: v.phaseId,
    };
    if (!resource.storage_path && v.url !== undefined) {
      const href = normalizeUrl(v.url);
      const detected = detectResource(v.url);
      if (!href || !detected) return fail("Escribe un enlace web válido");
      update.url = href;
      update.kind = detected.kind;
      update.source = detected.origin;
    }

    const { error } = await supabase.from("resources").update(update).eq("id", resource.id);
    if (error) return fail(error.message);
    return { ok: true };
  });
}

export async function togglePinResource(input: { resourceId: string; pinned: boolean }): Promise<ActionResult> {
  const parsed = z.object({ resourceId: uuid, pinned: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return runAction(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("resources")
      .update({ pinned: parsed.data.pinned })
      .eq("id", parsed.data.resourceId)
      .select("id")
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("No se encontró el recurso");
    return { ok: true };
  });
}

export async function deleteResource(input: { resourceId: string }): Promise<ActionResult> {
  const parsed = z.object({ resourceId: uuid }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return runAction(async () => {
    const supabase = await createClient();
    const { data: resource } = await supabase.from("resources").select("id, storage_path").eq("id", parsed.data.resourceId).maybeSingle();
    if (!resource) return fail("No se encontró el recurso");

    const { error } = await supabase.from("resources").delete().eq("id", resource.id);
    if (error) return fail(error.message);
    if (resource.storage_path) await supabase.storage.from(BUCKET).remove([resource.storage_path]);
    return { ok: true };
  });
}

export async function setTaskResources(input: { taskId: string; resourceIds: string[] }): Promise<ActionResult> {
  const parsed = z.object({ taskId: uuid, resourceIds: z.array(uuid).max(100) }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const wanted = [...new Set(parsed.data.resourceIds)];

  return runAction(async () => {
    const supabase = await createClient();
    const { data: task } = await supabase.from("tasks").select("id, project_id").eq("id", parsed.data.taskId).maybeSingle();
    if (!task) return fail("No se encontró la tarea");

    if (wanted.length > 0) {
      const { data: valid } = await supabase.from("resources").select("id").eq("project_id", task.project_id).in("id", wanted);
      if ((valid?.length ?? 0) !== wanted.length) return fail("Algún recurso no pertenece a este proyecto");
    }

    const { data: current, error: currentError } = await supabase.from("task_resources").select("resource_id").eq("task_id", task.id);
    if (currentError) return fail(currentError.message);
    const have = new Set((current ?? []).map((l) => l.resource_id));

    const toRemove = [...have].filter((r) => !wanted.includes(r));
    const toAdd = wanted.filter((r) => !have.has(r));

    if (toRemove.length > 0) {
      const { error } = await supabase.from("task_resources").delete().eq("task_id", task.id).in("resource_id", toRemove);
      if (error) return fail(error.message);
    }
    if (toAdd.length > 0) {
      const { error } = await supabase.from("task_resources").insert(toAdd.map((resource_id) => ({ task_id: task.id, resource_id })));
      if (error) return fail(error.message);
    }
    return { ok: true };
  });
}

export async function addNote(input: { projectId: string; body: string }): Promise<ActionResult> {
  const parsed = z
    .object({ projectId: uuid, body: z.string().trim().min(1, "Escribe la nota").max(1000, "La nota es muy larga") })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return runAction(async () => {
    const supabase = await assertProject(parsed.data.projectId);
    if (!supabase) return fail("No se encontró el proyecto");

    const { data: last } = await supabase
      .from("project_notes")
      .select("position")
      .eq("project_id", parsed.data.projectId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase
      .from("project_notes")
      .insert({ project_id: parsed.data.projectId, body: parsed.data.body, position: (last?.position ?? -1) + 1 });
    if (error) return fail(error.message);
    return { ok: true };
  });
}

export async function updateNote(input: { noteId: string; body: string }): Promise<ActionResult> {
  const parsed = z
    .object({ noteId: uuid, body: z.string().trim().min(1, "Escribe la nota").max(1000, "La nota es muy larga") })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return runAction(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("project_notes").update({ body: parsed.data.body }).eq("id", parsed.data.noteId).select("id").maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("No se encontró la nota");
    return { ok: true };
  });
}

export async function deleteNote(input: { noteId: string }): Promise<ActionResult> {
  const parsed = z.object({ noteId: uuid }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("project_notes").delete().eq("id", parsed.data.noteId);
    if (error) return fail(error.message);
    return { ok: true };
  });
}

const contactSchema = z.object({
  projectId: uuid,
  contactId: uuid.optional(),
  name: z.string().trim().min(1, "Escribe el nombre del contacto").max(120, "El nombre es muy largo"),
  role: z.string().trim().max(120, "El rol es muy largo"),
  detail: z.string().trim().max(300, "El detalle es muy largo"),
});

export async function saveContact(input: z.input<typeof contactSchema>): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  return runAction(async () => {
    const supabase = await assertProject(v.projectId);
    if (!supabase) return fail("No se encontró el proyecto");

    const row = { name: v.name, role: v.role || null, detail: v.detail || null };
    if (v.contactId) {
      const { data, error } = await supabase.from("project_contacts").update(row).eq("id", v.contactId).select("id").maybeSingle();
      if (error) return fail(error.message);
      if (!data) return fail("No se encontró el contacto");
    } else {
      const { error } = await supabase.from("project_contacts").insert({ ...row, project_id: v.projectId });
      if (error) return fail(error.message);
    }
    return { ok: true };
  });
}

export async function deleteContact(input: { contactId: string }): Promise<ActionResult> {
  const parsed = z.object({ contactId: uuid }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("project_contacts").delete().eq("id", parsed.data.contactId);
    if (error) return fail(error.message);
    return { ok: true };
  });
}
