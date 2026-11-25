"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, firstIssue, uuid, type ActionResult } from "@/lib/actions";
import { detectResource, normalizeUrl, suggestResourceName } from "@/lib/domain/resourceDetect";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "project-files";
const MAX_NOTEPAD = 50000;

const noteBody = z.string().trim().min(1, "Escribe la nota").max(5000, "La nota admite máximo 5000 caracteres");

/** Los conteos de notas y adjuntos se ven también en el tablero de Pendientes. */
function refresh() {
  revalidatePath("/pendientes", "layout");
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

/** Guarda el bloc de escritura libre. Revalida solo el tablero (si hay texto o no); la página ya tiene el texto en pantalla. */
export async function saveQuickTaskNotepad(input: { id: string; content: string }): Promise<ActionResult> {
  const parsed = z
    .object({ id: uuid, content: z.string().max(MAX_NOTEPAD, `El bloc admite hasta ${MAX_NOTEPAD.toLocaleString("es-CO")} caracteres`) })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("quick_tasks").update({ notepad: parsed.data.content }).eq("id", parsed.data.id).select("id").maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("No se encontró el pendiente");
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "No se pudo guardar");
  }
}

export async function addNote(input: { quickTaskId: string; body: string }): Promise<ActionResult> {
  const parsed = z.object({ quickTaskId: uuid, body: noteBody }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return run(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("quick_task_notes").insert({ quick_task_id: parsed.data.quickTaskId, body: parsed.data.body });
    return error ? fail(error.message) : { ok: true };
  });
}

export async function updateNote(input: { id: string; body: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, body: noteBody }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return run(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("quick_task_notes").update({ body: parsed.data.body }).eq("id", parsed.data.id).select("id").maybeSingle();
    if (error) return fail(error.message);
    return data ? { ok: true } : fail("No se encontró la nota");
  });
}

export async function deleteNote(input: { id: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return run(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("quick_task_notes").delete().eq("id", parsed.data.id);
    return error ? fail(error.message) : { ok: true };
  });
}

const attachmentName = z.string().trim().min(1, "El adjunto necesita un nombre").max(160, "El nombre es muy largo");

export async function addLinkAttachment(input: { quickTaskId: string; url: string; name: string }): Promise<ActionResult> {
  const parsed = z.object({ quickTaskId: uuid, url: z.string().trim().min(1, "Pega un enlace"), name: z.string().trim().max(160, "El nombre es muy largo") }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const href = normalizeUrl(parsed.data.url);
  const detected = detectResource(parsed.data.url);
  if (!href || !detected) return fail("El enlace no es válido");
  const name = attachmentName.safeParse(parsed.data.name || suggestResourceName(parsed.data.url));
  if (!name.success) return fail(firstIssue(name.error));

  return run(async () => {
    const supabase = await createClient();
    const { data: task } = await supabase.from("quick_tasks").select("id").eq("id", parsed.data.quickTaskId).maybeSingle();
    if (!task) return fail("No se encontró el pendiente");
    const { error } = await supabase
      .from("quick_task_attachments")
      .insert({ quick_task_id: parsed.data.quickTaskId, kind: "link", name: name.data, url: href, source: detected.origin });
    return error ? fail(error.message) : { ok: true };
  });
}

/** Registra un archivo que el navegador ya subió a Storage en `{usuario}/pendientes/{pendiente}/…`. */
export async function addFileAttachment(input: { quickTaskId: string; storagePath: string; name: string }): Promise<ActionResult> {
  const parsed = z.object({ quickTaskId: uuid, storagePath: z.string().min(1), name: attachmentName }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  return run(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const prefix = `${user?.id}/pendientes/${v.quickTaskId}/`;
    if (!user || !v.storagePath.startsWith(prefix) || v.storagePath.includes("..")) return fail("Ruta de archivo no válida");
    const { data: task } = await supabase.from("quick_tasks").select("id").eq("id", v.quickTaskId).maybeSingle();
    if (!task) {
      await supabase.storage.from(BUCKET).remove([v.storagePath]);
      return fail("No se encontró el pendiente");
    }

    const { error } = await supabase
      .from("quick_task_attachments")
      .insert({ quick_task_id: v.quickTaskId, kind: "file", name: v.name, storage_path: v.storagePath, source: "Archivo" });
    if (error) {
      await supabase.storage.from(BUCKET).remove([v.storagePath]);
      return fail(error.message);
    }
    return { ok: true };
  });
}

/** Elimina el adjunto y, si era un archivo, también lo borra de Storage. */
export async function deleteAttachment(input: { id: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return run(async () => {
    const supabase = await createClient();
    const { data: att } = await supabase.from("quick_task_attachments").select("storage_path").eq("id", parsed.data.id).maybeSingle();
    if (!att) return fail("No se encontró el adjunto");
    const { error } = await supabase.from("quick_task_attachments").delete().eq("id", parsed.data.id);
    if (error) return fail(error.message);
    if (att.storage_path) await supabase.storage.from(BUCKET).remove([att.storage_path]);
    return { ok: true };
  });
}
