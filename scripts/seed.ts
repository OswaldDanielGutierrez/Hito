// Datos de ejemplo (solo desarrollo). Usa la llave de servicio.
//   node --env-file=.env.local scripts/seed.ts <correo-del-dueño>
//   node --env-file=.env.local scripts/seed.ts <correo-del-dueño> --clean   (borra los de ejemplo)
// Las fechas son relativas a hoy (America/Bogota), así los escenarios siempre se cumplen.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

type Status = Database["public"]["Enums"]["project_status"];
type PhaseStatus = Database["public"]["Enums"]["phase_status"];
type TaskState = Database["public"]["Enums"]["task_state"];
type Kind = Database["public"]["Enums"]["resource_kind"];

interface PhaseSeed {
  name: string;
  status: PhaseStatus;
  est: number;
  orig?: number;
  done?: number;
  tasks: [title: string, state: TaskState][];
}

interface ProjectSeed {
  name: string;
  area: string;
  description: string;
  responsible: string;
  status: Status;
  startOffset: number;
  updatedHoursAgo: number;
  phases: PhaseSeed[];
  resources: { documents: number; flows: number; code: number; links: number };
}

const t = (title: string, state: TaskState): [string, TaskState] => [title, state];

const PROJECTS: ProjectSeed[] = [
  {
    name: "Agente de atención por WhatsApp",
    area: "Atención al cliente",
    description: "Agente de IA que responde consultas frecuentes y escala casos al equipo.",
    responsible: "Equipo de automatización",
    status: "qa",
    startOffset: -60,
    updatedHoursAgo: 3,
    resources: { documents: 3, flows: 2, code: 2, links: 2 },
    phases: [
      { name: "Levantamiento", status: "completed", est: -50, done: -50, tasks: [t("Entrevistas con el equipo", "done"), t("Mapa de preguntas frecuentes", "done"), t("Definir alcance", "done")] },
      { name: "Diseño de flujos", status: "completed", est: -38, done: -39, tasks: [t("Diagrama de conversación", "done"), t("Reglas de escalamiento", "done"), t("Tono y estilo de respuestas", "done")] },
      { name: "Desarrollo", status: "completed", est: -14, done: -13, tasks: [t("Conectar canal de WhatsApp", "done"), t("Base de conocimiento", "done"), t("Prompt del agente", "done"), t("Registro de conversaciones", "done")] },
      { name: "QA", status: "in_progress", est: 1, orig: -3, tasks: [t("Pruebas con 20 conversaciones reales", "in_progress"), t("Corregir respuestas fuera de alcance", "blocked"), t("Prueba de carga", "pending"), t("Validar escalamiento a humano", "pending")] },
      { name: "Capacitación", status: "pending", est: 2, tasks: [t("Guía rápida para el equipo", "pending"), t("Sesión de capacitación", "pending")] },
      { name: "Producción", status: "pending", est: 2, tasks: [t("Puesta en marcha y monitoreo", "pending")] },
    ],
  },
  {
    name: "Automatización de cartera",
    area: "Finanzas",
    description: "Flujo que concilia pagos y envía recordatorios de cobro.",
    responsible: "Equipo de automatización",
    status: "production",
    startOffset: -70,
    updatedHoursAgo: 26,
    resources: { documents: 1, flows: 2, code: 1, links: 1 },
    phases: [
      { name: "Levantamiento", status: "completed", est: -55, done: -52, tasks: [t("Revisar proceso actual", "done"), t("Listado de clientes y reglas", "done")] },
      { name: "Desarrollo", status: "completed", est: -30, done: -31, tasks: [t("Flujo de conciliación", "done"), t("Plantillas de recordatorio", "done"), t("Reporte semanal", "done")] },
      { name: "Pruebas con usuarios", status: "completed", est: -12, done: -12, tasks: [t("Prueba con el área de cartera", "done")] },
      { name: "Producción", status: "in_progress", est: -2, orig: -9, tasks: [t("Pasar el flujo a producción", "in_progress"), t("Esperar permisos de la cuenta de correo", "blocked"), t("Documentar operación", "pending")] },
    ],
  },
  {
    name: "Registro de incapacidades",
    area: "Talento humano",
    description: "Formulario y flujo para registrar y notificar incapacidades.",
    responsible: "Equipo de automatización",
    status: "development",
    startOffset: -20,
    updatedHoursAgo: 50,
    resources: { documents: 2, flows: 1, code: 1, links: 2 },
    phases: [
      { name: "Levantamiento", status: "completed", est: -10, done: -10, tasks: [t("Requisitos con talento humano", "done"), t("Campos del formulario", "done")] },
      { name: "Diseño", status: "completed", est: -3, done: -3, tasks: [t("Pantallas del formulario", "done"), t("Modelo de datos", "done")] },
      { name: "Desarrollo", status: "in_progress", est: 12, tasks: [t("Formulario de registro", "done"), t("Flujo de notificación al jefe", "in_progress"), t("Carga de soportes", "in_progress"), t("Reporte mensual", "pending"), t("Validaciones", "pending")] },
      { name: "QA", status: "pending", est: 26, tasks: [t("Casos de prueba", "pending"), t("Prueba con usuarios", "pending")] },
      { name: "Producción", status: "pending", est: 33, tasks: [t("Publicación", "pending")] },
    ],
  },
  {
    name: "Portal de clientes",
    area: "Comercial",
    description: "Portal web para que los clientes consulten pedidos y facturas.",
    responsible: "Equipo de desarrollo",
    status: "development",
    startOffset: -5,
    updatedHoursAgo: 8,
    resources: { documents: 1, flows: 0, code: 1, links: 2 },
    phases: [
      { name: "Levantamiento", status: "completed", est: -1, done: -1, tasks: [t("Entrevistas con clientes", "done"), t("Historias de usuario", "done"), t("Priorizar funciones", "done")] },
      { name: "Diseño de pantallas", status: "in_progress", est: 6, tasks: [t("Inicio de sesión y registro", "done"), t("Lista de pedidos", "done"), t("Detalle de factura", "in_progress"), t("Revisión con el cliente", "pending")] },
      { name: "Desarrollo", status: "pending", est: 30, tasks: [t("Autenticación", "pending"), t("Consulta de pedidos", "pending"), t("Descarga de facturas", "pending"), t("Panel de ayuda", "pending")] },
      { name: "QA", status: "pending", est: 45, tasks: [t("Pruebas funcionales", "pending"), t("Pruebas de seguridad", "pending")] },
      { name: "Capacitación", status: "pending", est: 52, tasks: [t("Manual de uso", "pending")] },
      { name: "Producción", status: "pending", est: 60, tasks: [t("Despliegue", "pending")] },
    ],
  },
  {
    name: "Inventario de equipos",
    area: "Tecnología",
    description: "App para llevar el inventario y la asignación de equipos.",
    responsible: "Equipo de desarrollo",
    status: "delivered",
    startOffset: -120,
    updatedHoursAgo: 24 * 20,
    resources: { documents: 1, flows: 0, code: 1, links: 1 },
    phases: [
      { name: "Levantamiento", status: "completed", est: -100, done: -100, tasks: [t("Relevamiento de equipos", "done")] },
      { name: "Diseño", status: "completed", est: -85, done: -86, tasks: [t("Diseño de la app", "done")] },
      { name: "Desarrollo", status: "completed", est: -60, done: -58, tasks: [t("Registro de equipos", "done"), t("Asignación a personas", "done")] },
      { name: "QA", status: "completed", est: -35, done: -35, tasks: [t("Pruebas", "done")] },
      { name: "Producción", status: "completed", est: -22, done: -20, tasks: [t("Entrega y cierre", "done")] },
    ],
  },
];

interface QuickSeed {
  title: string;
  project: string | null;
  by: string;
  due: number | "friday" | "nextMonday" | null;
  high?: boolean;
  done?: boolean;
}

/** 17 pendientes: 2 atrasados, 7 de hoy (2 hechos, 2 de alta), 3 de mañana, 2 del viernes, 1 del lunes siguiente, 2 sin fecha y 3 sin proyecto. */
const QUICK_TASKS: QuickSeed[] = [
  { title: "Enviar el informe de cartera al área financiera", project: "Automatización de cartera", by: "Laura P.", due: -2, high: true },
  { title: "Confirmar accesos de usuarios del portal", project: "Portal de clientes", by: "Andrés R.", due: -1 },
  { title: "Responder la consulta de Camilo sobre el flujo de incapacidades", project: "Registro de incapacidades", by: "Camilo V.", due: 0, done: true },
  { title: "Revisar la conversación de prueba del agente", project: "Agente de atención por WhatsApp", by: "Diana S.", due: 0, high: true },
  { title: "Actualizar la lista de contactos del proyecto", project: "Portal de clientes", by: "Yo", due: 0, done: true },
  { title: "Preparar la demo para la reunión de las 3", project: "Agente de atención por WhatsApp", by: "Jorge T.", due: 0, high: true },
  { title: "Pasar el flujo de cartera a producción", project: "Automatización de cartera", by: "Laura P.", due: 0 },
  { title: "Ajustar el formulario de incapacidades", project: "Registro de incapacidades", by: "Andrés R.", due: 0 },
  { title: "Renovar el certificado del servidor de pruebas", project: null, by: "Yo", due: 0 },
  { title: "Enviar el cronograma actualizado", project: "Portal de clientes", by: "Diana S.", due: 1 },
  { title: "Cotizar licencias del equipo", project: null, by: "Jorge T.", due: 1 },
  { title: "Documentar el proceso de conciliación", project: "Automatización de cartera", by: "Yo", due: 1 },
  { title: "Capacitar al equipo de atención", project: "Agente de atención por WhatsApp", by: "Laura P.", due: "friday" },
  { title: "Revisar permisos del inventario", project: "Inventario de equipos", by: "Camilo V.", due: "friday" },
  { title: "Planificar la siguiente fase del portal", project: "Portal de clientes", by: "Yo", due: "nextMonday" },
  { title: "Ordenar la carpeta de documentos compartidos", project: null, by: "Yo", due: null },
  { title: "Investigar opciones de respaldo automático", project: "Inventario de equipos", by: "Jorge T.", due: null },
];

const RESOURCE_TEMPLATES: Record<string, { kind: Kind; source: string; name: string; url: (n: number) => string }> = {
  documents: { kind: "document", source: "SharePoint", name: "Documento", url: (n) => `https://ejemplo.sharepoint.com/sites/proyectos/documento-${n}.docx` },
  flows: { kind: "flow", source: "Power Automate", name: "Flujo", url: (n) => `https://make.powerautomate.com/environments/ejemplo/flows/flujo-${n}` },
  code: { kind: "code", source: "GitHub", name: "Repositorio", url: (n) => `https://github.com/ejemplo/repositorio-${n}` },
  links: { kind: "link", source: "Figma", name: "Enlace", url: (n) => `https://www.figma.com/file/ejemplo-${n}` },
};

const todayInBogota = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86_400_000).toISOString().slice(0, 10);
};

const [email, flag] = process.argv.slice(2);
if (!email || (flag && flag !== "--clean")) {
  console.error("Uso: node --env-file=.env.local scripts/seed.ts <correo-del-dueño> [--clean]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const admin = createClient<Database>(url, key, { auth: { persistSession: false } });

const { data: users, error: usersError } = await admin.auth.admin.listUsers();
if (usersError) throw usersError;
const owner = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!owner) {
  console.error(`No existe un usuario con el correo ${email}`);
  process.exit(1);
}

// Los pendientes de ejemplo se borran primero: al borrar los proyectos quedarían sin proyecto.
const { error: quickCleanError } = await admin
  .from("quick_tasks")
  .delete()
  .eq("owner_id", owner.id)
  .in("title", QUICK_TASKS.map((q) => q.title));
if (quickCleanError) throw quickCleanError;

const { error: cleanError } = await admin
  .from("projects")
  .delete()
  .eq("owner_id", owner.id)
  .in("name", PROJECTS.map((p) => p.name));
if (cleanError) throw cleanError;

if (flag === "--clean") {
  console.log("Proyectos de ejemplo eliminados.");
  process.exit(0);
}

const today = todayInBogota();
const projectIds = new Map<string, string>();

for (const p of PROJECTS) {
  const { data: project, error } = await admin
    .from("projects")
    .insert({
      owner_id: owner.id,
      name: p.name,
      area: p.area,
      description: p.description,
      responsible: p.responsible,
      status: p.status,
      start_date: addDays(today, p.startOffset),
      updated_at: new Date(Date.now() - p.updatedHoursAgo * 3_600_000).toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;

  const { data: phases, error: phasesError } = await admin
    .from("phases")
    .insert(
      p.phases.map((ph, i) => ({
        owner_id: owner.id,
        project_id: project.id,
        name: ph.name,
        position: i + 1,
        status: ph.status,
        estimated_date: addDays(today, ph.est),
        original_date: addDays(today, ph.orig ?? ph.est),
        completed_at: ph.done === undefined ? null : addDays(today, ph.done),
      })),
    )
    .select("id, position");
  if (phasesError) throw phasesError;

  const tasks = p.phases.flatMap((ph, i) => {
    const phaseId = phases.find((x) => x.position === i + 1)!.id;
    return ph.tasks.map(([title, state], j) => ({
      owner_id: owner.id,
      project_id: project.id,
      phase_id: phaseId,
      title,
      state,
      priority: (["high", "medium", "low"] as const)[(i + j) % 3],
      due_date: state === "done" ? null : addDays(today, ph.est - (j % 2)),
      estimated_hours: 2 + ((i + j) % 4) * 2,
      blocked_reason: state === "blocked" ? "Pendiente de respuesta del área" : null,
      position: j,
    }));
  });
  const { error: tasksError } = await admin.from("tasks").insert(tasks);
  if (tasksError) throw tasksError;

  let n = 0;
  const resources = Object.entries(p.resources).flatMap(([group, count]) =>
    Array.from({ length: count }, () => {
      n++;
      const tpl = RESOURCE_TEMPLATES[group];
      return {
        owner_id: owner.id,
        project_id: project.id,
        kind: tpl.kind,
        source: tpl.source,
        name: `${tpl.name} ${n}`,
        url: tpl.url(n),
        pinned: n <= 2,
      };
    }),
  );
  if (resources.length > 0) {
    const { error: resError } = await admin.from("resources").insert(resources);
    if (resError) throw resError;
  }

  projectIds.set(p.name, project.id);
  console.log(`✓ ${p.name} · ${p.phases.length} fases · ${tasks.length} tareas · ${resources.length} recursos`);
}

// ── Pendientes de ejemplo ──
const weekday = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0 domingo … 6 sábado
const fridayOffset = ({ 1: 4, 2: 3, 3: 2, 4: 1, 5: 7, 6: 6, 0: 5 } as Record<number, number>)[weekday];
const nextMondayOffset = ((8 - weekday) % 7) || 7;

const quickRows = QUICK_TASKS.map((q) => ({
  owner_id: owner.id,
  title: q.title,
  project_id: q.project ? (projectIds.get(q.project) ?? null) : null,
  requested_by: q.by,
  due_date: q.due === null ? null : addDays(today, q.due === "friday" ? fridayOffset : q.due === "nextMonday" ? nextMondayOffset : q.due),
  priority: q.high ? ("high" as const) : ("medium" as const),
  done: q.done ?? false,
}));
const { error: quickError } = await admin.from("quick_tasks").insert(quickRows);
if (quickError) throw quickError;
console.log(`✓ ${quickRows.length} pendientes`);
