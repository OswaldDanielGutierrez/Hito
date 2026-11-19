"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, firstIssue, isoDate, uuid, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/data/activity";
import { diffDays, formatDate, todayInBogota } from "@/lib/domain/dates";
import { detectResource, normalizeUrl } from "@/lib/domain/resourceDetect";
import { projectStatusLabel } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

const text = (max: number, message: string) => z.string().trim().max(max, message);

function refresh() {
  revalidatePath("/proyectos/[id]", "layout");
  revalidatePath("/");
}

async function run(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    const result = await fn();
    if (result.ok) refresh();
    return result;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "No se pudo guardar el cambio");
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre del proyecto").max(120, "El nombre es muy largo"),
  area: text(120, "El área es muy larga"),
  description: text(2000, "La descripción es muy larga"),
  responsible: text(120, "El responsable es muy largo"),
  startDate: isoDate,
  phases: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Cada fase necesita un nombre").max(80, "El nombre de la fase es muy largo"),
        date: isoDate,
      }),
    )
    .min(1, "Agrega al menos una fase")
    .max(30, "Máximo 30 fases"),
  resources: z
    .array(
      z.object({
        url: z.string().trim().min(1),
        name: z.string().trim().min(1, "Cada recurso necesita un nombre").max(160, "El nombre del recurso es muy largo"),
      }),
    )
    .max(30, "Máximo 30 recursos"),
  notifyPhase: z.boolean(),
});

/** Crea proyecto, fases, recursos y reglas de alerta en una sola transacción (función `create_project`). */
export async function createProject(input: z.input<typeof createSchema>): Promise<ActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  const resources = [];
  for (const r of v.resources) {
    const href = normalizeUrl(r.url);
    const detected = detectResource(r.url);
    if (!href || !detected) return fail(`El enlace «${r.url}» no es válido`);
    resources.push({ kind: detected.kind, name: r.name, url: href, source: detected.origin });
  }

  let projectId: string;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_project", {
      p_name: v.name,
      p_area: v.area,
      p_description: v.description,
      p_responsible: v.responsible,
      p_start_date: v.startDate,
      p_phases: v.phases,
      p_resources: resources,
      p_notify_phase: v.notifyPhase,
    });
    if (error || !data) return fail(error?.message ?? "No se pudo crear el proyecto");
    projectId = data;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "No se pudo crear el proyecto");
  }

  refresh();
  redirect(`/proyectos/${projectId}`);
}

const updateSchema = z.object({
  projectId: uuid,
  name: z.string().trim().min(1, "Escribe el nombre del proyecto").max(120, "El nombre es muy largo"),
  area: text(120, "El área es muy larga"),
  description: text(2000, "La descripción es muy larga"),
  responsible: text(120, "El responsable es muy largo"),
  startDate: isoDate.nullable(),
});

export async function updateProject(input: z.input<typeof updateSchema>): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  return run(async () => {
    const supabase = await createClient();
    const { data: project } = await supabase.from("projects").select("*").eq("id", v.projectId).maybeSingle();
    if (!project) return fail("No se encontró el proyecto");

    const next = {
      name: v.name,
      area: v.area || null,
      description: v.description || null,
      responsible: v.responsible || null,
      start_date: v.startDate,
    };
    const { error } = await supabase.from("projects").update(next).eq("id", project.id);
    if (error) return fail(error.message);

    const labels: [keyof typeof next, string][] = [
      ["name", "Nombre del proyecto"],
      ["area", "Área"],
      ["description", "Descripción"],
      ["responsible", "Responsable"],
      ["start_date", "Fecha de inicio"],
    ];
    const show = (key: keyof typeof next, value: string | null) =>
      value === null || value === "" ? "—" : key === "start_date" ? formatDate(value) : value;

    await logActivity(
      supabase,
      labels
        .filter(([key]) => (project[key] ?? null) !== next[key])
        .map(([key, summary]) => ({
          projectId: project.id,
          kind: "scope" as const,
          entityType: "project" as const,
          entityId: project.id,
          summary,
          oldValue: show(key, project[key] ?? null),
          newValue: show(key, next[key]),
        })),
    );
    return { ok: true };
  });
}

const statusSchema = z.object({
  projectId: uuid,
  status: z.enum(["development", "qa", "production", "delivered", "on_hold"]),
  note: text(300, "La nota es muy larga").optional(),
  completePending: z.boolean(),
});

export async function changeProjectStatus(input: z.input<typeof statusSchema>): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const v = parsed.data;

  return run(async () => {
    const supabase = await createClient();
    const { data: project } = await supabase.from("projects").select("id, status").eq("id", v.projectId).maybeSingle();
    if (!project) return fail("No se encontró el proyecto");
    if (project.status === v.status) return { ok: true };

    const { error } = await supabase.from("projects").update({ status: v.status }).eq("id", project.id);
    if (error) return fail(error.message);

    await logActivity(supabase, {
      projectId: project.id,
      kind: "status",
      entityType: "project",
      entityId: project.id,
      summary: "Estado del proyecto",
      oldValue: projectStatusLabel[project.status],
      newValue: projectStatusLabel[v.status],
      reason: v.note,
    });

    if (v.status === "delivered" && v.completePending) {
      const { data: closed, error: closeError } = await supabase
        .from("phases")
        .update({ status: "completed", completed_at: todayInBogota() })
        .eq("project_id", project.id)
        .neq("status", "completed")
        .select("id");
      if (closeError) return fail(closeError.message);

      if (closed && closed.length > 0) {
        await logActivity(supabase, {
          projectId: project.id,
          kind: "phase",
          entityType: "project",
          entityId: project.id,
          summary: "Fases completadas al entregar el proyecto",
          newValue: `${closed.length} ${closed.length === 1 ? "fase" : "fases"}`,
        });
      }
    }
    return { ok: true };
  });
}

export async function archiveProject(input: { projectId: string }): Promise<ActionResult> {
  const parsed = z.object({ projectId: uuid }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const result = await run(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", parsed.data.projectId)
      .is("archived_at", null)
      .select("id")
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return fail("No se encontró el proyecto");

    await logActivity(supabase, {
      projectId: data.id,
      kind: "scope",
      entityType: "project",
      entityId: data.id,
      summary: "Proyecto archivado",
    });
    return { ok: true };
  });
  if (!result.ok) return result;
  redirect("/");
}

export async function restoreProject(input: { projectId: string }): Promise<ActionResult> {
  const parsed = z.object({ projectId: uuid }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .update({ archived_at: null })
      .eq("id", parsed.data.projectId)
      .not("archived_at", "is", null)
      .select("id")
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return { ok: true };

    await logActivity(supabase, {
      projectId: data.id,
      kind: "scope",
      entityType: "project",
      entityId: data.id,
      summary: "Proyecto restaurado",
    });
    return { ok: true };
  });
}

export async function deleteProject(input: { projectId: string; confirmName: string }): Promise<ActionResult> {
  const parsed = z.object({ projectId: uuid, confirmName: z.string() }).safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const result = await run(async () => {
    const supabase = await createClient();
    const { data: project } = await supabase.from("projects").select("id, name").eq("id", parsed.data.projectId).maybeSingle();
    if (!project) return fail("No se encontró el proyecto");
    if (parsed.data.confirmName.trim() !== project.name) return fail("El nombre no coincide. No se eliminó nada.");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: files } = user ? await supabase.storage.from("project-files").list(`${user.id}/${project.id}`) : { data: null };

    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) return fail(error.message);

    if (user && files && files.length > 0) {
      await supabase.storage.from("project-files").remove(files.map((f) => `${user.id}/${project.id}/${f.name}`));
    }
    return { ok: true };
  });
  if (!result.ok) return result;
  redirect("/");
}

export async function saveAsTemplate(input: { projectId: string; name: string }): Promise<ActionResult> {
  const parsed = z
    .object({ projectId: uuid, name: z.string().trim().min(1, "Escribe un nombre para la plantilla").max(80, "El nombre es muy largo") })
    .safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  return run(async () => {
    const supabase = await createClient();
    const { data: project } = await supabase
      .from("projects")
      .select("id, start_date")
      .eq("id", parsed.data.projectId)
      .maybeSingle();
    if (!project) return fail("No se encontró el proyecto");
    if (!project.start_date) return fail("El proyecto necesita una fecha de inicio para calcular las fechas de la plantilla");

    const { data: phases, error: phasesError } = await supabase
      .from("phases")
      .select("name, estimated_date, position")
      .eq("project_id", project.id)
      .order("position");
    if (phasesError) return fail(phasesError.message);
    if (!phases || phases.length === 0) return fail("El proyecto no tiene fases");
    if (phases.some((p) => !p.estimated_date)) return fail("Todas las fases necesitan fecha estimada");

    const start = project.start_date;
    const { error } = await supabase.from("phase_templates").insert({
      name: parsed.data.name,
      phases: phases.map((p) => ({ name: p.name, offset_days: Math.max(0, diffDays(start, p.estimated_date!)) })),
    });
    if (error) return fail(error.message);
    return { ok: true };
  });
}
