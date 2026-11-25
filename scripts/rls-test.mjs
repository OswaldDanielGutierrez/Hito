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

  // Tablas añadidas en M5–M8: cada usuario solo ve y toca lo suyo.
  const projectId = proj.data.id;
  const seeded = await Promise.all([
    a.from("resources").insert({ project_id: projectId, kind: "link", name: "Recurso de A", url: "https://github.com/a/a" }),
    a.from("project_notes").insert({ project_id: projectId, body: "Nota de A" }),
    a.from("project_contacts").insert({ project_id: projectId, name: "Contacto de A" }),
    a.from("activity_log").insert({ project_id: projectId, kind: "scope", summary: "Cambio de A" }),
    a.from("alert_rules").insert({ project_id: projectId, kind: "overdue", days_before: 0 }),
    a.from("notifications").insert({ project_id: projectId, kind: "overdue", title: "Alerta de A", scheduled_for: "2026-12-01", channel: "in_app" }),
  ]);
  check("A crea recursos, notas, contactos, historial, reglas y notificaciones", seeded.every((r) => !r.error));

  for (const table of ["resources", "project_notes", "project_contacts", "activity_log", "alert_rules", "notifications"]) {
    const asB = await b.from(table).select("*");
    check(`B no ve filas de ${table} de A`, !asB.error && asB.data.length === 0);
    const asAnon = await anonymous.from(table).select("*");
    check(`Sin sesión no se ve ${table}`, !asAnon.data?.length);
  }

  const updateNotepad = await b.from("projects").update({ notepad: "hackeado" }).eq("id", projectId).select();
  check("B no puede escribir en el bloc de notas de A", updateNotepad.data?.length === 0);
  const deleteResource = await b.from("resources").delete().eq("project_id", projectId).select();
  check("B no puede borrar recursos de A", deleteResource.data?.length === 0);
  const markRead = await b.from("notifications").update({ read_at: new Date().toISOString() }).eq("project_id", projectId).select();
  check("B no puede marcar como leídas las notificaciones de A", markRead.data?.length === 0);

  const moveAsB = await b.rpc("move_phase", { p_phase_id: phase.data.id, p_direction: "down" });
  check("B no puede mover fases de A (move_phase respeta RLS)", !!moveAsB.error);
  const generateAsA = await a.rpc("generate_alerts");
  check("Un usuario normal no puede ejecutar generate_alerts", !!generateAsA.error);
  const createAsAnon = await anonymous.rpc("create_project", { p_name: "x", p_area: "", p_description: "", p_responsible: "", p_start_date: "2026-12-01", p_phases: [{ name: "F", date: "2026-12-01" }] });
  check("Sin sesión no se puede crear proyectos (create_project)", !!createAsAnon.error);

  // Pendientes (quick_tasks): cada usuario solo ve y toca los suyos.
  const quick = await a.from("quick_tasks").insert({ title: "Pendiente de A", requested_by: "Laura P.", project_id: projectId }).select().single();
  check("A crea un pendiente", !quick.error && quick.data?.owner_id === ids[0]);
  check("A ve su pendiente", (await a.from("quick_tasks").select("id")).data?.length === 1);
  check("B no ve pendientes de A", (await b.from("quick_tasks").select("id")).data?.length === 0);
  check("Sin sesión no se ven pendientes", !(await anonymous.from("quick_tasks").select("id")).data?.length);
  check("B no puede editar pendientes de A", (await b.from("quick_tasks").update({ title: "hackeado" }).eq("id", quick.data.id).select()).data?.length === 0);
  check("B no puede borrar pendientes de A", (await b.from("quick_tasks").delete().eq("id", quick.data.id).select()).data?.length === 0);
  check("B no puede crear pendientes a nombre de A", !!(await b.from("quick_tasks").insert({ title: "Falso", owner_id: ids[0] })).error);
  const done = await a.from("quick_tasks").update({ done: true }).eq("id", quick.data.id).select().single();
  check("Marcar como hecho guarda la hora (done_at)", !!done.data?.done_at);
  const undone = await a.from("quick_tasks").update({ done: false }).eq("id", quick.data.id).select().single();
  check("Desmarcar limpia la hora (done_at)", undone.data?.done_at === null);

  // Etiquetas: cada usuario solo ve y toca las suyas; las asignaciones no cruzan usuarios.
  const tagA = await a.from("tags").insert({ name: "Power Apps", color: "blue" }).select().single();
  check("A crea una etiqueta", !tagA.error && !!tagA.data);
  check("A no puede repetir el nombre (sin importar mayúsculas)", !!(await a.from("tags").insert({ name: " power apps " })).error);
  check("Color inválido se rechaza", !!(await a.from("tags").insert({ name: "Otra", color: "fucsia" })).error);
  check("B no ve etiquetas de A", (await b.from("tags").select("id")).data?.length === 0);
  check("B puede crear una etiqueta con el mismo nombre", !(await b.from("tags").insert({ name: "Power Apps" })).error);
  check("B no puede editar etiquetas de A", (await b.from("tags").update({ name: "hackeada" }).eq("id", tagA.data.id).select()).data?.length === 0);
  check("A etiqueta su proyecto", !(await a.from("project_tags").insert({ project_id: proj.data.id, tag_id: tagA.data.id })).error);
  check("A etiqueta su pendiente", !(await a.from("quick_task_tags").insert({ quick_task_id: quick.data.id, tag_id: tagA.data.id })).error);
  check("B no ve asignaciones de A", (await b.from("project_tags").select("tag_id")).data?.length === 0 && (await b.from("quick_task_tags").select("tag_id")).data?.length === 0);
  check("B no puede etiquetar el proyecto de A", !!(await b.from("project_tags").insert({ project_id: proj.data.id, tag_id: tagA.data.id })).error);
  const tagB = await b.from("tags").select("id").single();
  check("B no puede usar su etiqueta en el pendiente de A", !!(await b.from("quick_task_tags").insert({ quick_task_id: quick.data.id, tag_id: tagB.data.id })).error);
  await a.from("tags").delete().eq("id", tagA.data.id);
  check("Eliminar la etiqueta la quita de proyectos y pendientes", (await a.from("project_tags").select("tag_id")).data?.length === 0 && (await a.from("quick_task_tags").select("tag_id")).data?.length === 0);

  // Fecha de creación inmutable.
  const projBefore = (await a.from("projects").select("created_at").eq("id", proj.data.id).single()).data.created_at;
  const projAfter = await a.from("projects").update({ created_at: "2000-01-01T00:00:00Z", name: "Proyecto de A" }).eq("id", proj.data.id).select("created_at").single();
  check("La fecha de creación de un proyecto no se puede cambiar", projAfter.data?.created_at === projBefore);
  const quickBefore = (await a.from("quick_tasks").select("created_at").eq("id", quick.data.id).single()).data.created_at;
  const quickAfter = await a.from("quick_tasks").update({ created_at: "2000-01-01T00:00:00Z", title: "Pendiente de A" }).eq("id", quick.data.id).select("created_at").single();
  check("La fecha de creación de un pendiente no se puede cambiar", quickAfter.data?.created_at === quickBefore);

  // Detalle del pendiente: secciones y notas.
  const sec = await a.from("quick_task_sections").insert({ quick_task_id: quick.data.id, title: "Contactos" }).select().single();
  check("A crea una sección en su pendiente", !sec.error && !!sec.data);
  const note = await a.from("quick_task_notes").insert({ quick_task_id: quick.data.id, section_id: sec.data.id, body: "Llamar a Laura" }).select().single();
  check("A crea una nota dentro de la sección", !note.error && !!note.data);
  check("A crea una nota general", !(await a.from("quick_task_notes").insert({ quick_task_id: quick.data.id, body: "General" })).error);
  const noteCreated = note.data.created_at;
  const noteEdit = await a.from("quick_task_notes").update({ body: "Llamar a Laura hoy", created_at: "2000-01-01T00:00:00Z" }).eq("id", note.data.id).select("created_at, body").single();
  check("Editar una nota conserva su fecha de creación", noteEdit.data?.created_at === noteCreated && noteEdit.data?.body === "Llamar a Laura hoy");
  check("B no ve secciones ni notas de A", (await b.from("quick_task_sections").select("id")).data?.length === 0 && (await b.from("quick_task_notes").select("id")).data?.length === 0);
  check("B no puede agregar secciones al pendiente de A", !!(await b.from("quick_task_sections").insert({ quick_task_id: quick.data.id, title: "Falsa" })).error);
  check("B no puede agregar notas al pendiente de A", !!(await b.from("quick_task_notes").insert({ quick_task_id: quick.data.id, body: "Falsa" })).error);
  check("B no puede editar ni borrar notas de A", (await b.from("quick_task_notes").update({ body: "x" }).eq("id", note.data.id).select()).data?.length === 0 && (await b.from("quick_task_notes").delete().eq("id", note.data.id).select()).data?.length === 0);
  const quick2 = await a.from("quick_tasks").insert({ title: "Otro pendiente de A" }).select().single();
  check("Una nota no puede usar la sección de otro pendiente", !!(await a.from("quick_task_notes").insert({ quick_task_id: quick2.data.id, section_id: sec.data.id, body: "cruzada" })).error);
  await a.from("quick_task_sections").delete().eq("id", sec.data.id);
  check("Eliminar una sección elimina sus notas (las generales quedan)", (await a.from("quick_task_notes").select("id").eq("quick_task_id", quick.data.id)).data?.length === 1);
  await a.from("quick_tasks").delete().eq("id", quick2.data.id);

  // Página del pendiente: bloc de escritura libre y adjuntos.
  const pad = await a.from("quick_tasks").update({ notepad: "Idea: automatizar el reporte" }).eq("id", quick.data.id).select("notepad, notepad_length").single();
  check("A escribe en el bloc de su pendiente", pad.data?.notepad === "Idea: automatizar el reporte" && pad.data?.notepad_length === 28);
  check("B no puede escribir en el bloc de A", (await b.from("quick_tasks").update({ notepad: "hackeado" }).eq("id", quick.data.id).select()).data?.length === 0);
  const att = await a.from("quick_task_attachments").insert({ quick_task_id: quick.data.id, kind: "link", name: "Manual", url: "https://example.com/manual" }).select().single();
  check("A adjunta un enlace a su pendiente", !att.error && !!att.data);
  check("Un adjunto necesita enlace o archivo", !!(await a.from("quick_task_attachments").insert({ quick_task_id: quick.data.id, kind: "link", name: "Vacío" })).error);
  check("B no ve adjuntos de A", (await b.from("quick_task_attachments").select("id")).data?.length === 0);
  check("B no puede adjuntar al pendiente de A", !!(await b.from("quick_task_attachments").insert({ quick_task_id: quick.data.id, kind: "link", name: "Falso", url: "https://example.com" })).error);
  check("B no puede borrar adjuntos de A", (await b.from("quick_task_attachments").delete().eq("id", att.data.id).select()).data?.length === 0);
  const attBefore = att.data.created_at;
  const attEdit = await a.from("quick_task_attachments").update({ name: "Manual v2", created_at: "2000-01-01T00:00:00Z" }).eq("id", att.data.id).select("created_at, name").single();
  check("Editar un adjunto conserva su fecha de creación", attEdit.data?.created_at === attBefore && attEdit.data?.name === "Manual v2");
  await a.from("quick_tasks").delete().eq("id", quick.data.id);
  check("Eliminar el pendiente elimina sus adjuntos y notas", (await a.from("quick_task_attachments").select("id")).data?.length === 0 && (await a.from("quick_task_notes").select("id")).data?.length === 0);
  const quickBack = await a.from("quick_tasks").insert({ title: "Pendiente de A (de nuevo)", requested_by: "Laura P.", project_id: projectId }).select().single();
  quick.data = quickBack.data;

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
