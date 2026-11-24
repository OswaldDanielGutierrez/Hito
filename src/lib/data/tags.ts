import { cache } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sortTags, toTagColor, type TagWithUsage } from "@/lib/domain/tags";

type Client = Awaited<ReturnType<typeof createClient>>;

/** Todas las etiquetas del usuario, con cuántos proyectos y pendientes las usan. */
export async function loadTags(): Promise<TagWithUsage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, color, project_tags(count), quick_task_tags(count)");
  if (error) throw new Error(error.message);

  return sortTags(
    (data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      color: toTagColor(t.color),
      projects: t.project_tags[0]?.count ?? 0,
      quickTasks: t.quick_task_tags[0]?.count ?? 0,
    })),
  );
}

/** Ids de etiquetas de cada proyecto: `{ [projectId]: tagId[] }`. */
export async function loadProjectTagIds(): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("project_tags").select("project_id, tag_id");
  if (error) throw new Error(error.message);
  const map: Record<string, string[]> = {};
  for (const row of data ?? []) (map[row.project_id] ??= []).push(row.tag_id);
  return map;
}

export const getProjectTagIds = cache(async (projectId: string): Promise<string[]> => {
  if (!z.string().uuid().safeParse(projectId).success) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("project_tags").select("tag_id").eq("project_id", projectId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.tag_id);
});

/** Ids de etiquetas de cada pendiente: `{ [quickTaskId]: tagId[] }`. */
export async function loadQuickTaskTagIds(): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("quick_task_tags").select("quick_task_id, tag_id");
  if (error) throw new Error(error.message);
  const map: Record<string, string[]> = {};
  for (const row of data ?? []) (map[row.quick_task_id] ??= []).push(row.tag_id);
  return map;
}

/** Verifica (con RLS) que todas las etiquetas existan y sean del usuario. */
async function allTagsExist(supabase: Client, tagIds: string[]) {
  if (tagIds.length === 0) return true;
  const { data } = await supabase.from("tags").select("id").in("id", tagIds);
  return (data?.length ?? 0) === new Set(tagIds).size;
}

/** Deja al proyecto exactamente con estas etiquetas. Devuelve un mensaje si falla. */
export async function syncProjectTags(supabase: Client, projectId: string, tagIds: string[]): Promise<string | null> {
  const ids = [...new Set(tagIds)];
  if (!(await allTagsExist(supabase, ids))) return "Alguna etiqueta ya no existe";

  const del = supabase.from("project_tags").delete().eq("project_id", projectId);
  const { error: delError } = ids.length > 0 ? await del.not("tag_id", "in", `(${ids.join(",")})`) : await del;
  if (delError) return delError.message;
  if (ids.length === 0) return null;

  const { error } = await supabase
    .from("project_tags")
    .upsert(ids.map((tag_id) => ({ project_id: projectId, tag_id })), { onConflict: "project_id,tag_id", ignoreDuplicates: true });
  return error?.message ?? null;
}

/** Deja al pendiente exactamente con estas etiquetas. Devuelve un mensaje si falla. */
export async function syncQuickTaskTags(supabase: Client, quickTaskId: string, tagIds: string[]): Promise<string | null> {
  const ids = [...new Set(tagIds)];
  if (!(await allTagsExist(supabase, ids))) return "Alguna etiqueta ya no existe";

  const del = supabase.from("quick_task_tags").delete().eq("quick_task_id", quickTaskId);
  const { error: delError } = ids.length > 0 ? await del.not("tag_id", "in", `(${ids.join(",")})`) : await del;
  if (delError) return delError.message;
  if (ids.length === 0) return null;

  const { error } = await supabase
    .from("quick_task_tags")
    .upsert(ids.map((tag_id) => ({ quick_task_id: quickTaskId, tag_id })), { onConflict: "quick_task_id,tag_id", ignoreDuplicates: true });
  return error?.message ?? null;
}
