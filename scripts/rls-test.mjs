// Prueba de RLS: dos usuarios temporales no deben ver datos del otro.
// Uso: node --env-file=.env.local scripts/rls-test.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, service, { auth: { persistSession: false } });
const stamp = Date.now();
const password = `Rls-${stamp}-Tmp!`;
const users = ["a", "b"].map((k) => ({ email: `rls-${k}-${stamp}@example.com`, password }));
const ids = [];
let failures = 0;

const check = (name, ok) => {
  console.log(`${ok ? "OK   " : "FALLA"} ${name}`);
  if (!ok) failures++;
};

async function signedClient(u) {
  const c = createClient(url, anon, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword(u);
  if (error) throw error;
  return c;
}

try {
  for (const u of users) {
    const { data, error } = await admin.auth.admin.createUser({ ...u, email_confirm: true });
    if (error) throw error;
    ids.push(data.user.id);
  }

  const [a, b] = [await signedClient(users[0]), await signedClient(users[1])];
  const anonymous = createClient(url, anon, { auth: { persistSession: false } });

  const proj = await a.from("projects").insert({ name: "Proyecto de A" }).select().single();
  check("A crea un proyecto", !proj.error && proj.data?.owner_id === ids[0]);

  const phase = await a
    .from("phases")
    .insert({ project_id: proj.data.id, name: "Fase 1", position: 1, estimated_date: "2026-12-01" })
    .select()
    .single();
  check("A crea una fase", !phase.error);

  const seenByA = await a.from("projects").select("id");
  check("A ve su proyecto", seenByA.data?.length === 1);

  const seenByB = await b.from("projects").select("id");
  check("B no ve proyectos de A", seenByB.data?.length === 0);

  const phasesB = await b.from("phases").select("id");
  check("B no ve fases de A", phasesB.data?.length === 0);

  const seenAnon = await anonymous.from("projects").select("id");
  check("Sin sesión no se ve nada", !seenAnon.data?.length);

  const hijack = await b.from("projects").update({ name: "Hackeado" }).eq("id", proj.data.id).select();
  check("B no puede editar el proyecto de A", hijack.data?.length === 0);

  const forged = await b.from("projects").insert({ name: "Falso", owner_id: ids[0] });
  check("B no puede crear filas a nombre de A", !!forged.error);

  const templates = await b.from("phase_templates").select("id, owner_id");
  check("B lee plantillas del sistema", !templates.error && templates.data.every((t) => t.owner_id === null));

  const editTpl = await b.from("phase_templates").update({ name: "x" }).is("owner_id", null).select();
  check("B no puede modificar plantillas del sistema", editTpl.data?.length === 0);
} catch (e) {
  console.error("Error en la prueba:", e.message ?? e);
  failures++;
} finally {
  for (const id of ids) await admin.auth.admin.deleteUser(id);
  console.log(`Usuarios temporales eliminados: ${ids.length}`);
}

console.log(failures === 0 ? "\nRLS verificado" : `\n${failures} verificación(es) fallaron`);
process.exit(failures === 0 ? 0 : 1);
