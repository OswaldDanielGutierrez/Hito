"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().trim().email("Escribe un correo válido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { error: "Correo o contraseña incorrectos" };
  }

  await supabase.from("user_settings").upsert(
    {
      user_id: data.user.id,
      display_name: data.user.email?.split("@")[0] ?? null,
      email_address: data.user.email ?? null,
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
