// hito · envía por correo (Resend) las notificaciones con channel = 'email' pendientes.
// Secretos de la función: RESEND_API_KEY, ALERTS_FROM_EMAIL y, opcional, SITE_URL.
// Sin RESEND_API_KEY o ALERTS_FROM_EMAIL no hace nada (responde `skipped`).
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

Deno.serve(async () => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("ALERTS_FROM_EMAIL");
  if (!apiKey || !from) return json({ skipped: "Falta RESEND_API_KEY o ALERTS_FROM_EMAIL" });

  const siteUrl = (Deno.env.get("SITE_URL") ?? "https://hito-orcin.vercel.app").replace(/\/$/, "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data: pending, error } = await supabase
    .from("notifications")
    .select("id, owner_id, project_id, title, body")
    .eq("channel", "email")
    .is("sent_at", null)
    .order("created_at")
    .limit(100);
  if (error) return json({ error: error.message }, 500);

  const emails = new Map<string, string | null>();
  const emailOf = async (ownerId: string) => {
    if (!emails.has(ownerId)) {
      const { data: settings } = await supabase.from("user_settings").select("email_address").eq("user_id", ownerId).maybeSingle();
      let address = settings?.email_address ?? null;
      if (!address) address = (await supabase.auth.admin.getUserById(ownerId)).data.user?.email ?? null;
      emails.set(ownerId, address);
    }
    return emails.get(ownerId) ?? null;
  };

  let sent = 0;
  const failures: string[] = [];

  for (const n of pending ?? []) {
    const to = await emailOf(n.owner_id);
    if (!to) {
      failures.push(`${n.id}: sin correo`);
      continue;
    }

    const link = n.project_id ? `${siteUrl}/proyectos/${n.project_id}` : siteUrl;
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px">
      <h2 style="margin:0 0 8px">${escapeHtml(n.title)}</h2>
      ${n.body ? `<p style="margin:0 0 16px;color:#58635D">${escapeHtml(n.body)}</p>` : ""}
      <a href="${link}" style="display:inline-block;background:#007A3D;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:600">Abrir en hito</a>
    </div>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: n.title, html }),
    });

    if (response.ok) {
      await supabase.from("notifications").update({ sent_at: new Date().toISOString() }).eq("id", n.id);
      sent++;
    } else {
      failures.push(`${n.id}: ${response.status}`);
    }
  }

  return json({ pending: pending?.length ?? 0, sent, failures });
});
