"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, firstIssue, uuid, type ActionResult } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

export interface DetailSection {
  id: string;
  title: string;
  createdAt: string;
}

export interface DetailNote {
  id: string;
  sectionId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type DetailResult = { ok: true; sections: DetailSection[]; notes: DetailNote[] } | { ok: false; error: string };

const title = z.string().trim().min(1, "Escribe el título de la sección").max(80, "El título admite máximo 80 caracteres");
const body = z.string().trim().min(1, "Escribe la nota").max(5000, "La nota admite máximo 5000 caracteres");

/** Las notas y secciones se cuentan en la tarjeta del pendiente. */
function refresh() {
  revalidatePath("/pendientes");
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

export async function getQuickTaskDetail(input: { quickTaskId: string }): Promise<DetailResult> {
  const parsed = z.object({ quickTaskId: uuid }).safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  try {
    const supabase = await createClient();
    const [sections, notes] = await Promise.all([
      supabase.from("quick_task_sections").select("id, title, created_at").eq("quick_task_id", parsed.data.quickTaskId).order("position").order("created_at"),
      supabase
        .from("quick_task_notes")
        .select("id, section_id, body, created_at, updated_at")
        .eq("quick_task_id", parsed.data.quickTaskId)
        .order("created_at"),
    ]);
    const error = sections.error ?? notes.error;
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      sections: (sections.data ?? []).map((s) => ({ id: s.id, title: s.title, createdAt: s.created_at })),
      notes: (notes.data ?? []).map((n) => ({ id: n.id, sectionId: n.section_id, body: n.body, createdAt: n.created_at, updatedAt: n.updated_at })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "No se pudo cargar el detalle" };
  }
}

export async function addSection(input: { quickTaskId: string; title: string }): Promise<ActionResult> {
  const parsed = z.object({ quickTaskId: uuid, title }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return run(async () => {
    const supabase = await createClient();
    const { count } = await supabase.from("quick_task_sections").select("id", { count: "exact", head: true }).eq("quick_task_id", parsed.data.quickTaskId);
    const { error } = await supabase
      .from("quick_task_sections")
      .insert({ quick_task_id: parsed.data.quickTaskId, title: parsed.data.title, position: count ?? 0 });
    return error ? fail(error.message) : { ok: true };
  });
}

export async function renameSection(input: { id: string; title: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, title }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return run(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("quick_task_sections").update({ title: parsed.data.title }).eq("id", parsed.data.id).select("id").maybeSingle();
    if (error) return fail(error.message);
    return data ? { ok: true } : fail("No se encontró la sección");
  });
}

/** Elimina la sección y las notas que contiene. */
export async function deleteSection(input: { id: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return run(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("quick_task_sections").delete().eq("id", parsed.data.id);
    return error ? fail(error.message) : { ok: true };
  });
}

export async function addNote(input: { quickTaskId: string; sectionId: string | null; body: string }): Promise<ActionResult> {
  const parsed = z.object({ quickTaskId: uuid, sectionId: uuid.nullable(), body }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  return run(async () => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("quick_task_notes")
      .insert({ quick_task_id: parsed.data.quickTaskId, section_id: parsed.data.sectionId, body: parsed.data.body });
    return error ? fail(error.message) : { ok: true };
  });
}

export async function updateNote(input: { id: string; body: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, body }).safeParse(input);
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
