"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, firstIssue, uuid, type ActionResult } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(input: { id: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .is("read_at", null);
  if (error) return fail(error.message);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("channel", "in_app")
    .is("read_at", null);
  if (error) return fail(error.message);

  revalidatePath("/", "layout");
  return { ok: true };
}
