"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, firstIssue, type ActionResult } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(input: { name: string }): Promise<ActionResult> {
  const parsed = z
    .object({ name: z.string().trim().min(1, "Escribe tu nombre").max(60, "El nombre es muy largo") })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Tu sesión expiró. Vuelve a iniciar sesión.");

    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, display_name: parsed.data.name, email_address: user.email ?? null }, { onConflict: "user_id" });
    if (error) return fail(error.message);

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "No se pudo guardar el nombre");
  }
}
