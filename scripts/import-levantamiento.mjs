// Importa los procesos de los Excel de levantamiento (docs/Proyectos) como proyectos de la app.
// Uso: node scripts/import-levantamiento.mjs <datos.json> [--dry]
//   <datos.json> lo genera la extracción de la hoja «Formato» (ver docs/03-datos.md, sección Importación).
// Es idempotente: omite los proyectos cuyo nombre ya existe. Usa la service role (solo local, nunca en el cliente).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const [, , dataFile, flag] = process.argv;
if (!dataFile) throw new Error("Indica el archivo JSON de datos");
const dry = flag === "--dry";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const data = JSON.parse(readFileSync(dataFile, "utf8"));

const FIX_NAME = { "Recepción de requerimietos compras": "Recepción de requerimientos de compras", "Proyeccion ingresos - egresos / Flujo de caja": "Proyección ingresos - egresos / Flujo de caja" };
const AREA = { Tesoreria: "Tesorería" };
const num = (n) => (Number.isInteger(+n) ? String(+n) : (+n).toFixed(1));
const sentence = (s) => (s === "" || s == null ? "" : String(s).trim().replace(/\s+/g, " "));

function ficha(r) {
  const f = (k) => sentence(r[k]);
  const lines = [
    "FICHA DEL LEVANTAMIENTO",
    "",
    "Cómo se hace hoy",
    f("Descripción breve (qué se hace y principales pasos)"),
    "",
    `Quién lo hace: ${f("Cargo(s) que lo ejecutan")} (${f("N° de personas que lo realizan")} persona(s))`,
    `Frecuencia: ${f("Frecuencia")} · ${f("Veces por frecuencia")} vez/veces · ${f("Tiempo por ejecución (minutos)")} min por ejecución`,
    f("Fecha u hora límite") && `Plazo: ${f("Fecha u hora límite")}`,
    `Carga: ${num(r["Veces al mes (calculado)"])} veces al mes · ${num(r["Horas-hombre al mes (calculado)"])} horas-hombre al mes · ${num(r["Horas-hombre al año (calculado)"])} horas-hombre al año`,
    "",
    `Sistemas: ${f("Sistemas o herramientas que utiliza")}`,
    `Origen de la información: ${f("Origen de la información")} (${f("Formato de la información de entrada")})`,
    `Entregable: ${f("Resultado o entregable y a quién se entrega")}`,
    `Tipo de reglas: ${f("Tipo de reglas")}`,
    "",
    `Principal dificultad: ${f("Principal dificultad")}`,
    `Errores o reprocesos: ${f("Frecuencia de errores o reprocesos")}`,
    `Impacto si falla o se retrasa: ${f("Impacto si falla o se retrasa")}`,
    `Prioridad para el área: ${f("Prioridad para el área")}`,
    r["Puntaje preliminar (1-5)"] !== "" && `Puntaje preliminar (1-5): ${r["Puntaje preliminar (1-5)"]}`,
    "",
    f("¿Qué esperaría de la automatización?") && `Qué esperan de la automatización: ${f("¿Qué esperaría de la automatización?")}`,
    f("¿Puede compartir un archivo de ejemplo?") && `¿Pueden compartir un archivo de ejemplo?: ${f("¿Puede compartir un archivo de ejemplo?")}`,
    f("Observaciones") && f("Observaciones") !== "N/A" && `Observaciones: ${f("Observaciones")}`,
  ];
  return lines.filter((l) => l !== false && l !== undefined && l !== null).join("\n");
}

const { data: users, error: ue } = await sb.auth.admin.listUsers();
if (ue) throw ue;
if (users.users.length !== 1) throw new Error(`Se esperaba 1 usuario, hay ${users.users.length}`);
const ownerId = users.users[0].id;

const { data: existing } = await sb.from("projects").select("name");
const taken = new Set((existing ?? []).map((p) => p.name));

let created = 0;
for (const [file, { meta, rows }] of Object.entries(data)) {
  const area = AREA[meta.area] ?? meta.area;
  const emails = (meta.correo.match(/[\w.+-]+@[\w.-]+\.\w+/g) ?? []).map((e) => e.toLowerCase());
  for (const r of rows) {
    const name = FIX_NAME[r["Nombre del proceso o tarea"]] ?? r["Nombre del proceso o tarea"];
    if (taken.has(name)) {
      console.log(`= ya existe: ${name}`);
      continue;
    }
    const expect = sentence(r["¿Qué esperaría de la automatización?"]);
    const description = [`Proceso del área de ${area} levantado para evaluar su automatización (${file}.xlsx).`, expect && `Lo que esperan: ${expect}`].filter(Boolean).join("\n\n").slice(0, 2000);
    const when = meta.fecha;
    if (dry) {
      console.log(`+ (simulación) ${area} · ${name} · ${num(r["Horas-hombre al año (calculado)"])} h/año`);
      continue;
    }

    const note = ficha(r); // se arma antes de escribir nada
    const { data: p, error } = await sb
      .from("projects")
      .insert({ owner_id: ownerId, name, area, description, responsible: meta.contacto, status: "on_hold", start_date: when })
      .select("id")
      .single();
    if (error) throw new Error(`${name}: ${error.message}`);
    const id = p.id;
    const rel = async (table, rowsToInsert) => {
      const { error: e } = await sb.from(table).insert(rowsToInsert.map((x) => ({ owner_id: ownerId, ...x })));
      if (e) {
        await sb.from("projects").delete().eq("id", id); // no deja proyectos a medias
        throw new Error(`${name} · ${table}: ${e.message}`);
      }
    };

    await rel("phases", [
      { project_id: id, name: "Levantamiento", position: 1, status: "completed", completed_at: when },
      { project_id: id, name: "Análisis de viabilidad", position: 2, status: "in_progress" },
    ]);
    await rel("project_notes", [{ project_id: id, body: note, position: 0 }]);

    const sameLeader = meta.lider.split(" ")[0].toLowerCase() === meta.contacto.split(" ")[0].toLowerCase();
    const contacts = [{ project_id: id, name: meta.contacto, role: sameLeader ? "Líder y contacto del área" : "Contacto del área", detail: [emails[0], area].filter(Boolean).join(" · ") }];
    if (!sameLeader) contacts.push({ project_id: id, name: meta.lider, role: "Líder del área", detail: [emails[1], area].filter(Boolean).join(" · ") });
    await rel("project_contacts", contacts);

    await rel("alert_rules", [
      { project_id: id, kind: "phase_due_soon", days_before: 2, send_time: "09:00", enabled: true },
      { project_id: id, kind: "final_due", days_before: 3, send_time: "09:00", enabled: true },
      { project_id: id, kind: "final_due", days_before: 1, send_time: "09:00", enabled: true },
      { project_id: id, kind: "final_due", days_before: 0, send_time: "08:00", enabled: true },
      { project_id: id, kind: "task_due", days_before: 1, send_time: "09:00", enabled: true },
      { project_id: id, kind: "stale", days_before: 5, send_time: "09:00", enabled: true },
      { project_id: id, kind: "overdue", days_before: 0, send_time: "09:00", enabled: true },
      { project_id: id, kind: "weekly_summary", days_before: 0, send_time: "07:30", enabled: true },
    ]);
    await rel("activity_log", [{ project_id: id, kind: "scope", entity_type: "project", entity_id: id, summary: "Proyecto creado", new_value: name, reason: `Importado de ${file}.xlsx` }]);

    taken.add(name);
    created++;
    console.log(`+ creado: ${area} · ${name}`);
  }
}
console.log(dry ? "Simulación terminada" : `Listo: ${created} proyecto(s) creados`);
