"use server";

import { z } from "zod";
import { fail, firstIssue, runAction, uuid, type ActionResult } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

export async function setAlertRule(input: { projectId: string; kind: string; enabled: boolean }): Promise<ActionResult> {
  const parsed = z
    .object({
      projectId: uuid,
      kind: z.enum(["phase_due_soon", "final_due", "task_due", "stale", "overdue", "weekly_summary"]),
      enabled: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return runAction(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("alert_rules")
      .update({ enabled: parsed.data.enabled })
      .eq("project_id", parsed.data.projectId)
      .eq("kind", parsed.data.kind)
      .select("id");
    if (error) return fail(error.message);
    if (!data || data.length === 0) return fail("No se encontró la regla");
    return { ok: true };
  });
}

export async function setNotificationChannel(input: { channel: "in_app" | "email"; enabled: boolean }): Promise<ActionResult> {
  const parsed = z.object({ channel: z.enum(["in_app", "email"]), enabled: z.boolean() }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return runAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Tu sesión expiró. Vuelve a iniciar sesión.");

    const channelColumns =
      parsed.data.channel === "in_app" ? { notify_in_app: parsed.data.enabled } : { notify_email: parsed.data.enabled };
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, email_address: user.email ?? null, ...channelColumns }, { onConflict: "user_id" });
    if (error) return fail(error.message);
    return { ok: true };
  });
}
