import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface ActivityEntry {
  projectId: string;
  kind: Database["public"]["Enums"]["change_kind"];
  entityType: "project" | "phase" | "task";
  entityId: string;
  summary: string;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
}

/** Escribe una fila en el historial. Lo llaman las Server Actions para poder guardar el motivo. */
export async function logActivity(supabase: SupabaseClient<Database>, entries: ActivityEntry | ActivityEntry[]) {
  const list = Array.isArray(entries) ? entries : [entries];
  if (list.length === 0) return;

  const { error } = await supabase.from("activity_log").insert(
    list.map((e) => ({
      project_id: e.projectId,
      kind: e.kind,
      entity_type: e.entityType,
      entity_id: e.entityId,
      summary: e.summary,
      old_value: e.oldValue ?? null,
      new_value: e.newValue ?? null,
      reason: e.reason?.trim() || null,
    })),
  );
  if (error) throw new Error(error.message);
}
