"use client";

import { ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import {
  createQuickTask,
  deleteQuickTask,
  restoreQuickTask,
  toggleQuickTask,
  updateQuickTask,
} from "@/app/(app)/pendientes/actions";
import { toast } from "@/components/ui/Toaster";
import { TAG_STYLES, tagsFromIds, type TagWithUsage } from "@/lib/domain/tags";
import {
  dayCounts,
  groupBySection,
  matchesDayFilter,
  olderDone,
  NO_PROJECT_COLOR,
  NO_PROJECT_KEY,
  progressToday,
  projectColor,
  requesterAvatar,
  tallyByProject,
  tallyByRequester,
  type DayFilter,
  type QuickTask,
  type SectionKey,
} from "@/lib/domain/pendientes";
import { Composer, type NewQuickTask } from "./Composer";
import { EditDialog, type QuickTaskPatch } from "./EditDialog";
import { QuickTaskDetail } from "./QuickTaskDetail";
import { ProgressCard, TallyCard } from "./SidePanel";
import { TaskCard } from "./TaskCard";

type Op =
  | { type: "add"; task: QuickTask }
  | { type: "toggle"; id: string; done: boolean; doneAt: string | null }
  | { type: "patch"; id: string; patch: Partial<QuickTask> }
  | { type: "remove"; id: string };

function reduce(tasks: QuickTask[], op: Op): QuickTask[] {
  switch (op.type) {
    case "add":
      return [op.task, ...tasks];
    case "toggle":
      return tasks.map((t) => (t.id === op.id ? { ...t, done: op.done, doneAt: op.doneAt } : t));
    case "patch":
      return tasks.map((t) => (t.id === op.id ? { ...t, ...op.patch } : t));
    case "remove":
      return tasks.filter((t) => t.id !== op.id);
  }
}

const DAY_PILLS: { value: DayFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "today", label: "Hoy" },
  { value: "tomorrow", label: "Mañana" },
  { value: "upcoming", label: "Próximos" },
  { value: "none", label: "Sin fecha" },
];

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

export function PendientesBoard({
  today,
  longDate,
  tasks: serverTasks,
  projects,
  requesters,
  ownerName,
  tags,
}: {
  today: string;
  longDate: string;
  tasks: QuickTask[];
  projects: { id: string; name: string }[];
  requesters: string[];
  ownerName: string;
  tags: TagWithUsage[];
}) {
  const [tasks, apply] = useOptimistic(serverTasks, reduce);
  const [, startTransition] = useTransition();

  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [requesterFilter, setRequesterFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(true);
  const [editing, setEditing] = useState<QuickTask | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const composerRef = useRef<HTMLInputElement>(null);

  // Atajo N: enfoca el compositor si no hay otro campo (ni un diálogo) con foco.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditable(e.target) || document.querySelector("[role=dialog]")) return;
      e.preventDefault();
      composerRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const allRequesters = useMemo(() => [...new Set([...requesters, ...tasks.map((t) => t.requestedBy)])], [requesters, tasks]);

  const groups = useMemo(() => groupBySection(tasks, today), [tasks, today]);
  const counts = useMemo(() => dayCounts(tasks, today), [tasks, today]);
  const history = useMemo(() => olderDone(tasks, today), [tasks, today]);
  const opened = tasks.find((t) => t.id === openingId) ?? null;
  const progress = useMemo(() => progressToday(tasks, today), [tasks, today]);
  const byRequester = useMemo(() => tallyByRequester(tasks), [tasks]);
  const byProject = useMemo(() => tallyByProject(tasks), [tasks]);

  const shown = groups
    .filter((g) => matchesDayFilter(g.key as SectionKey, dayFilter))
    .map((g) => {
      const filtered = g.tasks.filter(
        (t) =>
          (showDone || !t.done) &&
          (requesterFilter === null || t.requestedBy === requesterFilter) &&
          (projectFilter === null || (t.projectId ?? NO_PROJECT_KEY) === projectFilter) &&
          (tagFilter === null || t.tagIds.includes(tagFilter)),
      );
      return { ...g, tasks: filtered, openCount: filtered.filter((t) => !t.done).length };
    })
    .filter((g) => g.tasks.length > 0);

  // Etiquetas con pendientes (o la activa), con cuántos pendientes abiertos tienen.
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) for (const id of t.tagIds) counts.set(id, (counts.get(id) ?? 0) + (t.done ? 0 : 1));
    return counts;
  }, [tasks]);
  const filterTags = tags.filter((t) => tagCounts.has(t.id) || t.id === tagFilter);
  const tagLabel = tags.find((t) => t.id === tagFilter)?.name ?? "etiqueta";

  // Hechos de días anteriores: se guardan siempre y se ven con «Todos», respetando los demás filtros.
  const historyShown =
    showDone && dayFilter === "all"
      ? history.filter(
          (t) =>
            (requesterFilter === null || t.requestedBy === requesterFilter) &&
            (projectFilter === null || (t.projectId ?? NO_PROJECT_KEY) === projectFilter) &&
            (tagFilter === null || t.tagIds.includes(tagFilter)),
        )
      : [];

  const hasAny = groups.some((g) => g.tasks.length > 0) || history.length > 0;
  const projectLabel = projectFilter === NO_PROJECT_KEY ? "Sin proyecto" : (byProject.find((p) => p.key === projectFilter)?.label ?? projects.find((p) => p.id === projectFilter)?.name ?? "proyecto");

  function failIf(result: { ok: boolean; error?: string }) {
    if (!result.ok) toast(result.error ?? "No se pudo guardar el cambio", "error");
  }

  function add(n: NewQuickTask) {
    const project = projects.find((p) => p.id === n.projectId);
    const temp: QuickTask = {
      id: `temp-${crypto.randomUUID()}`,
      title: n.title,
      projectId: n.projectId,
      projectName: project?.name ?? null,
      requestedBy: n.requestedBy,
      dueDate: n.dueDate,
      priority: n.priority,
      done: false,
      doneAt: null,
      createdAt: new Date().toISOString(),
      tagIds: n.tagIds,
      sectionsCount: 0,
      notesCount: 0,
    };
    startTransition(async () => {
      apply({ type: "add", task: temp });
      const result = await createQuickTask(n);
      failIf(result);
    });
  }

  function toggle(task: QuickTask) {
    const done = !task.done;
    const doneAt = done ? new Date().toISOString() : null;
    startTransition(async () => {
      apply({ type: "toggle", id: task.id, done, doneAt });
      failIf(await toggleQuickTask({ id: task.id, done }));
    });
  }

  function rename(task: QuickTask, title: string) {
    startTransition(async () => {
      apply({ type: "patch", id: task.id, patch: { title } });
      failIf(await updateQuickTask({ id: task.id, title }));
    });
  }

  function saveDetails(task: QuickTask, patch: QuickTaskPatch) {
    const project = projects.find((p) => p.id === patch.projectId);
    startTransition(async () => {
      apply({
        type: "patch",
        id: task.id,
        patch: {
          title: patch.title,
          projectId: patch.projectId,
          projectName: patch.projectId ? (project?.name ?? task.projectName) : null,
          requestedBy: patch.requestedBy,
          dueDate: patch.dueDate,
          priority: patch.priority,
          tagIds: patch.tagIds,
        },
      });
      failIf(await updateQuickTask({ id: task.id, ...patch }));
    });
  }

  function remove(task: QuickTask) {
    startTransition(async () => {
      apply({ type: "remove", id: task.id });
      const result = await deleteQuickTask({ id: task.id });
      if (!result.ok) return failIf(result);
      toast("Pendiente eliminado", "success", {
        duration: 5000,
        actionLabel: "Deshacer",
        onAction: async () => {
          const restored = await restoreQuickTask({
            id: task.id,
            title: task.title,
            projectId: task.projectId,
            requestedBy: task.requestedBy,
            dueDate: task.dueDate,
            priority: task.priority,
            done: task.done,
            createdAt: task.createdAt,
            tagIds: task.tagIds,
          });
          if (restored.ok) toast("Pendiente restaurado");
          else failIf(restored);
        },
      });
    });
  }

  const renderCard = (task: QuickTask) => (
    <TaskCard
      key={task.id}
      task={task}
      tags={tagsFromIds(task.tagIds, tags)}
      today={today}
      ownerName={ownerName}
      onToggle={() => toggle(task)}
      onRename={(title) => rename(task, title)}
      onOpen={() => setOpeningId(task.id)}
      onEdit={() => setEditing(task)}
      onDelete={() => remove(task)}
    />
  );

  const empty = (title: string, hint: string) => (
    <div className="rounded-card border-2 border-dashed border-green-200 bg-white px-5 py-8 text-center">
      <p className="text-base font-extrabold">{title}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
    </div>
  );

  return (
    <main id="contenido" className="mx-auto flex w-full max-w-[1376px] flex-col gap-5 px-4 py-5 sm:px-8 sm:py-7">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div>
          <p className="text-sm text-muted">{longDate}</p>
          <h1 className="text-2xl leading-8 font-extrabold tracking-[-0.02em] sm:text-[30px] sm:leading-[38px]">Pendientes</h1>
          <p className="mt-1 text-sm text-muted">Lo que te piden en el día, aunque no esté en el plan de un proyecto.</p>
        </div>
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="size-4 accent-green-700" />
          Mostrar hechos
        </label>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Composer projects={projects} tags={tags} requesters={allRequesters} today={today} inputRef={composerRef} onAdd={add} />

          <div role="group" aria-label="Filtrar por día" className="flex flex-wrap gap-2">
            {DAY_PILLS.map(({ value, label }) => {
              const active = dayFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDayFilter(value)}
                  className={`rounded-pill border px-3.5 py-[7px] text-[13px] font-semibold transition-colors duration-[120ms] ease-out ${
                    active ? "border-green-900 bg-green-900 text-white" : "border-line bg-white text-ink hover:border-input-border"
                  }`}
                >
                  {label} <span className="opacity-75">{counts[value]}</span>
                </button>
              );
            })}
          </div>

          {filterTags.length > 0 && (
            <div role="group" aria-label="Filtrar por etiqueta" className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-muted">Etiquetas</span>
              {filterTags.map((t) => {
                const active = tagFilter === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTagFilter(active ? null : t.id)}
                    className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-[5px] text-[13px] font-semibold transition-colors duration-[120ms] ease-out ${
                      active ? "border-green-900 bg-green-900 text-white" : "border-line bg-white text-ink hover:border-input-border"
                    }`}
                  >
                    <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: TAG_STYLES[t.color].dot }} />
                    {t.name} <span className="opacity-75">{tagCounts.get(t.id) ?? 0}</span>
                  </button>
                );
              })}
            </div>
          )}

          {(requesterFilter !== null || projectFilter !== null || tagFilter !== null) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-muted">Filtrando por</span>
              {requesterFilter !== null && (
                <FilterChip label={requesterFilter} onRemove={() => setRequesterFilter(null)} />
              )}
              {projectFilter !== null && <FilterChip label={projectLabel} onRemove={() => setProjectFilter(null)} />}
              {tagFilter !== null && <FilterChip label={tagLabel} onRemove={() => setTagFilter(null)} />}
            </div>
          )}

          {!hasAny
            ? empty("Aún no tienes pendientes", "Escribe el primero arriba.")
            : shown.length === 0 && historyShown.length === 0
              ? empty("No hay pendientes aquí", "Cambia el filtro o agrega uno nuevo arriba.")
              : shown.map((group) => {
                  const overdue = group.key === "overdue";
                  return (
                    <section key={group.key} aria-label={group.label} className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className={`text-base font-extrabold ${overdue ? "text-danger" : ""}`}>{group.label}</h2>
                        <span
                          className={`rounded-pill px-2 py-0.5 text-xs font-bold ${overdue ? "bg-[#FDECEA] text-danger" : "bg-surface"}`}
                        >
                          {group.openCount}
                        </span>
                        {group.range && <span className="text-xs font-semibold text-muted">{group.range}</span>}
                      </div>
                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 min-[1280px]:grid-cols-3">
                        {group.tasks.map((task) => renderCard(task))}
                      </div>
                    </section>
                  );
                })}

          {historyShown.length > 0 && (
            <section aria-label="Hechos anteriores" className="flex flex-col gap-3">
              <h2 className="text-base font-extrabold">
                <button
                  type="button"
                  aria-expanded={historyOpen}
                  aria-controls="hechos-anteriores"
                  onClick={() => setHistoryOpen((v) => !v)}
                  className="inline-flex items-center gap-2 text-left"
                >
                  <ChevronRight size={18} strokeWidth={1.9} aria-hidden className={`transition-transform duration-[120ms] ${historyOpen ? "rotate-90" : ""}`} />
                  Hechos anteriores
                  <span className="rounded-pill bg-surface px-2 py-0.5 text-xs font-bold">{historyShown.length}</span>
                </button>
              </h2>
              <p className="text-xs text-muted">Los pendientes que terminaste en días anteriores se guardan aquí; no se borran con el tiempo.</p>
              {historyOpen && (
                <div id="hechos-anteriores" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 min-[1280px]:grid-cols-3">
                  {historyShown.map((task) => renderCard(task))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside aria-label="Resumen de pendientes" className="flex min-w-0 flex-col gap-4">
          <ProgressCard progress={progress} />
          <TallyCard
            title="Quién los pidió"
            rows={byRequester}
            active={requesterFilter}
            onToggle={(key) => setRequesterFilter((cur) => (cur === key ? null : key))}
            leading={(row) => {
              const a = requesterAvatar(row.key, ownerName);
              return (
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
                  style={{ backgroundColor: a.bg, color: a.ink }}
                >
                  {a.initials}
                </span>
              );
            }}
            barColor={() => "#00A859"}
            empty="Sin pendientes abiertos."
          />
          <TallyCard
            title="Por proyecto"
            rows={byProject}
            active={projectFilter}
            onToggle={(key) => setProjectFilter((cur) => (cur === key ? null : key))}
            leading={(row) => (
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.key === NO_PROJECT_KEY ? NO_PROJECT_COLOR : projectColor(row.key) }}
              />
            )}
            barColor={(row) => (row.key === NO_PROJECT_KEY ? NO_PROJECT_COLOR : projectColor(row.key))}
            empty="Sin pendientes abiertos."
          />
        </aside>
      </div>

      {opened && <QuickTaskDetail key={opened.id} task={opened} onClose={() => setOpeningId(null)} />}

      {editing && (
        <EditDialog
          key={editing.id}
          task={editing}
          projects={projects}
          tags={tags}
          requesters={allRequesters}
          onSave={(patch) => saveDetails(editing, patch)}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border border-green-200 bg-green-50 py-1 pr-1.5 pl-3 text-[13px] font-bold text-green-800">
      {label}
      <button
        type="button"
        aria-label={`Quitar filtro de ${label}`}
        onClick={onRemove}
        className="flex size-6 items-center justify-center rounded-full hover:bg-green-100"
      >
        <X size={14} strokeWidth={2} aria-hidden />
      </button>
    </span>
  );
}
