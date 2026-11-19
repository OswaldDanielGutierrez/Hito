"use client";

import { ChevronRight, Link as LinkIcon, Plus } from "lucide-react";
import { useState } from "react";
import type { PhaseData, TaskData } from "@/lib/data/project";
import { daysUntil, formatDate } from "@/lib/domain/dates";
import { phaseNote } from "@/lib/domain/phaseNote";
import { priorityLabel, taskStateLabel } from "@/lib/labels";
import { priorityColors, taskStateColors } from "@/lib/ui-colors";

const th = "px-3 py-2 text-left text-[11px] font-bold tracking-[.06em] text-muted uppercase";

export function PhaseGroup({
  phase,
  index,
  isCurrent,
  open,
  tasks,
  today,
  adding,
  onToggle,
  onStartAdd,
  onStopAdd,
  onAddTask,
  onCycleState,
  onOpenTask,
  onEditDate,
  onComplete,
  onReopen,
}: {
  phase: PhaseData;
  index: number;
  isCurrent: boolean;
  open: boolean;
  tasks: TaskData[];
  today: string;
  adding: boolean;
  onToggle: () => void;
  onStartAdd: () => void;
  onStopAdd: () => void;
  onAddTask: (title: string) => void;
  onCycleState: (task: TaskData) => void;
  onOpenTask: (task: TaskData) => void;
  onEditDate: () => void;
  onComplete: () => void;
  onReopen: () => void;
}) {
  const [draft, setDraft] = useState("");
  const isDone = phase.status === "completed";
  const note = phaseNote({ ...phase, status: isCurrent ? "in_progress" : phase.status });
  const total = tasks.length;
  const counts = {
    done: tasks.filter((t) => t.state === "done").length,
    in_progress: tasks.filter((t) => t.state === "in_progress").length,
    blocked: tasks.filter((t) => t.state === "blocked").length,
    pending: tasks.filter((t) => t.state === "pending").length,
  };
  const circle = isDone ? "#007A3D" : isCurrent ? "#D9822B" : "#9AA49F";
  const panelId = `fase-${phase.id}`;

  return (
    <section className="overflow-hidden rounded-card border border-line bg-white" aria-labelledby={`${panelId}-titulo`}>
      <div className={`flex flex-wrap items-center gap-3 px-[18px] py-3.5 ${isCurrent ? "bg-[#FFFAF4]" : ""}`}>
        <h2 id={`${panelId}-titulo`}>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={panelId}
            className="flex items-center gap-2.5 rounded-input text-left"
          >
            <ChevronRight
              size={18}
              strokeWidth={1.9}
              aria-hidden
              className={`text-muted transition-transform duration-[120ms] ease-out ${open ? "rotate-90" : ""}`}
            />
            <span
              aria-hidden
              className="flex size-[26px] items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: circle, color: isCurrent ? "#17201B" : "#FFFFFF" }}
            >
              {index + 1}
            </span>
            <span className="text-base font-extrabold">{phase.name}</span>
          </button>
        </h2>

        <button
          type="button"
          onClick={onEditDate}
          aria-label={`Entrega estimada de ${phase.name}: ${phase.estimatedDate ? formatDate(phase.estimatedDate) : "sin fecha"}. Cambiar`}
          className="rounded-pill border border-line bg-white px-3 py-1 text-xs font-semibold hover:border-input-border"
        >
          Entrega estimada {phase.estimatedDate ? formatDate(phase.estimatedDate) : "—"}
        </button>
        <span className="text-xs font-bold" style={{ color: note.color }}>
          {note.text}
        </span>

        <div className="ml-auto flex items-center gap-4">
          {isCurrent && (
            <button type="button" onClick={onComplete} className="text-[13px] font-bold text-green-700 hover:underline">
              Completar fase
            </button>
          )}
          {isDone && (
            <button type="button" onClick={onReopen} className="text-[13px] font-bold text-muted hover:text-ink hover:underline">
              Reabrir fase
            </button>
          )}
          <div className="flex items-center gap-2">
            <div
              role="img"
              aria-label={`${counts.done} de ${total} tareas hechas`}
              className="flex h-2.5 w-[160px] gap-0.5 overflow-hidden"
            >
              {total === 0 ? (
                <span className="h-full flex-1 rounded-[3px] bg-[#C9D0CC]" />
              ) : (
                (
                  [
                    ["done", "#007A3D"],
                    ["in_progress", "#D9822B"],
                    ["blocked", "#B42318"],
                    ["pending", "#C9D0CC"],
                  ] as const
                )
                  .filter(([key]) => counts[key] > 0)
                  .map(([key, color]) => (
                    <span
                      key={key}
                      className="h-full rounded-[3px]"
                      style={{ width: `${(counts[key] / total) * 100}%`, backgroundColor: color }}
                    />
                  ))
              )}
            </div>
            <span className="text-xs font-bold">
              {counts.done}/{total}
            </span>
          </div>
        </div>
      </div>

      {open && (
        <div id={panelId} className="overflow-x-auto border-t border-surface">
          {total === 0 && !adding ? (
            <p className="px-[18px] py-4 text-sm text-muted">Esta fase no tiene tareas. Agrega la primera.</p>
          ) : (
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  <th className={th}>Tarea</th>
                  <th className={`${th} w-[140px]`}>Estado</th>
                  <th className={`${th} w-[120px]`}>Prioridad</th>
                  <th className={`${th} w-[110px]`}>Fecha</th>
                  <th className={`${th} w-[100px] text-right`}>Estimado</th>
                  <th className={`${th} w-[120px]`}>Recursos</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const state = taskStateColors[task.state];
                  const priority = priorityColors[task.priority];
                  const days = task.dueDate ? daysUntil(task.dueDate, today) : null;
                  const dateClass =
                    task.state === "done" || days === null
                      ? "text-muted"
                      : days < 0
                        ? "font-bold text-danger"
                        : days <= 1
                          ? "font-bold text-warn"
                          : "text-muted";
                  return (
                    <tr key={task.id} className="border-t border-surface">
                      <td className="px-3 py-1">
                        <button
                          type="button"
                          onClick={() => onOpenTask(task)}
                          className="w-full rounded-input px-1 py-1.5 text-left text-sm font-semibold hover:underline"
                        >
                          {task.title}
                        </button>
                      </td>
                      <td className="px-3 py-1">
                        <button
                          type="button"
                          onClick={() => onCycleState(task)}
                          aria-label={`${task.title}: ${taskStateLabel[task.state]}. Cambiar estado`}
                          className="h-9 w-full rounded-label text-xs font-bold transition-colors duration-[120ms] ease-out"
                          style={{ backgroundColor: state.bg, color: state.ink }}
                        >
                          {taskStateLabel[task.state]}
                        </button>
                      </td>
                      <td className="px-3 py-1">
                        <span
                          className="inline-block rounded-pill px-2.5 py-1 text-xs font-semibold"
                          style={{ backgroundColor: priority.bg, color: priority.ink }}
                        >
                          {priorityLabel[task.priority]}
                        </span>
                      </td>
                      <td className={`px-3 py-1 text-[13px] ${dateClass}`}>{task.dueDate ? formatDate(task.dueDate) : "—"}</td>
                      <td className="px-3 py-1 text-right text-[13px] text-muted">
                        {task.estimatedHours === null ? "—" : `${task.estimatedHours} h`}
                      </td>
                      <td className="px-3 py-1 text-[13px] text-muted">
                        {task.linkedResourceIds.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <LinkIcon size={14} strokeWidth={1.9} aria-hidden />
                            {task.linkedResourceIds.length} {task.linkedResourceIds.length === 1 ? "recurso" : "recursos"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="border-t border-surface px-[18px] py-2.5">
            {adding ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const title = draft.trim();
                  if (!title) return;
                  onAddTask(title);
                  setDraft("");
                }}
                className="flex items-center gap-3"
              >
                <label htmlFor={`${panelId}-nueva`} className="sr-only">
                  Título de la nueva tarea en {phase.name}
                </label>
                <input
                  id={`${panelId}-nueva`}
                  autoFocus
                  maxLength={200}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setDraft("");
                      onStopAdd();
                    }
                  }}
                  placeholder="Título de la tarea y Enter"
                  className="h-9 flex-1 rounded-input border border-input-border bg-white px-3 text-sm"
                />
                <button type="button" onClick={() => { setDraft(""); onStopAdd(); }} className="text-[13px] font-semibold text-muted hover:text-ink">
                  Listo
                </button>
              </form>
            ) : (
              <button type="button" onClick={onStartAdd} className="flex items-center gap-1.5 text-[13px] font-bold text-green-700 hover:underline">
                <Plus size={16} strokeWidth={1.9} aria-hidden />
                Agregar tarea a {phase.name}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
