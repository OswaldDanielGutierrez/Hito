"use server";

import { z } from "zod";
import { fail, firstIssue, uuid, type ActionResult } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

/** Guarda el bloc de notas. No revalida: el editor ya tiene el texto en pantalla. */
export async function saveNotepad(input: { projectId: string; content: string }): Promise<ActionResult> {
  const parsed = z
    .object({ projectId: uuid, content: z.string().max(50000, "El bloc de notas admite hasta 50.000 caracteres") })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .update({ notepad: parsed.data.content })
      .eq("id", parsed.data.projectId)
      .select("id")
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("No se encontró el proyecto");
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "No se pudo guardar");
  }
}
