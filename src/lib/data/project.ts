import { cache } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Enums = Database["public"]["Enums"];

export interface ProjectInfo {
  id: string;
  name: string;
  area: string | null;
  description: string | null;
  responsible: string | null;
  status: Enums["project_status"];
  startDate: string | null;
  updatedAt: string;
  archivedAt: string | null;
  notepad: string;
}

export interface PhaseData {
  id: string;
  name: string;
  position: number;
  status: Enums["phase_status"];
  estimatedDate: string | null;
  originalDate: string | null;
  completedAt: string | null;
}

export interface TaskData {
  id: string;
  phaseId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  state: Enums["task_state"];
  priority: Enums["task_priority"];
  dueDate: string | null;
  estimatedHours: number | null;
  blockedReason: string | null;
  position: number;
  linkedResourceIds: string[];
}

export interface ResourceData {
  id: string;
  kind: Enums["resource_kind"];
  name: string;
  url: string | null;
  storagePath: string | null;
  source: string | null;
  pinned: boolean;
  phaseId: string | null;
  createdAt: string;
}

export interface ProjectData {
  project: ProjectInfo;
  phases: PhaseData[];
  tasks: TaskData[];
  resources: ResourceData[];
}

const uuid = z.string().uuid();

/** Todo lo que necesitan las pantallas de un proyecto. `null` si no existe o no es del usuario. */
export const getProjectData = cache(async (id: string): Promise<ProjectData | null> => {
  if (!uuid.safeParse(id).success) return null;

  const supabase = await createClient();
  const [project, phases, tasks, resources, links] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("phases").select("*").eq("project_id", id).order("position"),
    supabase.from("tasks").select("*").eq("project_id", id).order("position"),
    supabase.from("resources").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("task_resources").select("task_id, resource_id, tasks!inner(project_id)").eq("tasks.project_id", id),
  ]);

  const error = project.error ?? phases.error ?? tasks.error ?? resources.error ?? links.error;
  if (error) throw new Error(error.message);
  if (!project.data) return null;

  const linked = new Map<string, string[]>();
  for (const l of links.data ?? []) linked.set(l.task_id, [...(linked.get(l.task_id) ?? []), l.resource_id]);

  const p = project.data;
  return {
    project: {
      id: p.id,
      name: p.name,
      area: p.area,
      description: p.description,
      responsible: p.responsible,
      status: p.status,
      startDate: p.start_date,
      updatedAt: p.updated_at,
      archivedAt: p.archived_at,
      notepad: p.notepad,
    },
    phases: (phases.data ?? []).map((ph) => ({
      id: ph.id,
      name: ph.name,
      position: ph.position,
      status: ph.status,
      estimatedDate: ph.estimated_date,
      originalDate: ph.original_date,
      completedAt: ph.completed_at,
    })),
    tasks: (tasks.data ?? []).map((t) => ({
      id: t.id,
      phaseId: t.phase_id,
      parentTaskId: t.parent_task_id,
      title: t.title,
      description: t.description,
      state: t.state,
      priority: t.priority,
      dueDate: t.due_date,
      estimatedHours: t.estimated_hours,
      blockedReason: t.blocked_reason,
      position: t.position,
      linkedResourceIds: linked.get(t.id) ?? [],
    })),
    resources: (resources.data ?? []).map((r) => ({
      id: r.id,
      kind: r.kind,
      name: r.name,
      url: r.url,
      storagePath: r.storage_path,
      source: r.source,
      pinned: r.pinned,
      phaseId: r.phase_id,
      createdAt: r.created_at,
    })),
  };
});

export interface NoteData {
  id: string;
  body: string;
}

export interface ContactData {
  id: string;
  name: string;
  role: string | null;
  detail: string | null;
}

/** Notas y contactos del proyecto (solo los necesita la pestaña Recursos). */
export const getProjectExtras = cache(async (id: string): Promise<{ notes: NoteData[]; contacts: ContactData[] }> => {
  if (!uuid.safeParse(id).success) return { notes: [], contacts: [] };

  const supabase = await createClient();
  const [notes, contacts] = await Promise.all([
    supabase.from("project_notes").select("id, body").eq("project_id", id).order("position").order("created_at"),
    supabase.from("project_contacts").select("id, name, role, detail").eq("project_id", id).order("created_at"),
  ]);
  const error = notes.error ?? contacts.error;
  if (error) throw new Error(error.message);

  return { notes: notes.data ?? [], contacts: contacts.data ?? [] };
});

export interface ActivityData {
  id: number;
  kind: Enums["change_kind"];
  summary: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  createdAt: string;
}

export interface AlertRuleData {
  kind: Enums["alert_kind"];
  daysBefore: number;
  enabled: boolean;
}

/** Historial de cambios, reglas de alerta del proyecto y canales de notificación del usuario. */
export const getProjectHistory = cache(
  async (id: string): Promise<{ entries: ActivityData[]; rules: AlertRuleData[]; notifyInApp: boolean; notifyEmail: boolean }> => {
    if (!uuid.safeParse(id).success) return { entries: [], rules: [], notifyInApp: true, notifyEmail: true };

    const supabase = await createClient();
    const [log, rules, settings] = await Promise.all([
      supabase
        .from("activity_log")
        .select("id, kind, summary, old_value, new_value, reason, created_at")
        .eq("project_id", id)
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("alert_rules").select("kind, days_before, enabled").eq("project_id", id),
      supabase.from("user_settings").select("notify_in_app, notify_email").maybeSingle(),
    ]);
    const error = log.error ?? rules.error ?? settings.error;
    if (error) throw new Error(error.message);

    return {
      entries: (log.data ?? []).map((e) => ({
        id: e.id,
        kind: e.kind,
        summary: e.summary,
        oldValue: e.old_value,
        newValue: e.new_value,
        reason: e.reason,
        createdAt: e.created_at,
      })),
      rules: (rules.data ?? []).map((r) => ({ kind: r.kind, daysBefore: r.days_before, enabled: r.enabled })),
      notifyInApp: settings.data?.notify_in_app ?? true,
      notifyEmail: settings.data?.notify_email ?? true,
    };
  },
);
