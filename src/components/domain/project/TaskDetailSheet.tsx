"use client";

import { ExternalLink } from "lucide-react";
import { useState, useTransition } from "react";
import { updateTask } from "@/app/(app)/proyectos/[id]/actions";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { ResourceData, TaskData } from "@/lib/data/project";
import type { TaskState } from "@/lib/domain/types";
import { priorityLabel, taskStateLabel } from "@/lib/labels";
import { fieldClass, labelClass } from "@/lib/ui-colors";

export function TaskDetailSheet({
  task,
  resources,
  onClose,
}: {
  task: TaskData;
  resources: ResourceData[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [state, setState] = useState<TaskState>(task.state);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [hours, setHours] = useState(task.estimatedHours === null ? "" : String(task.estimatedHours));
  const [blockedReason, setBlockedReason] = useState(task.blockedReason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const linked = resources.filter((r) => task.linkedResourceIds.includes(r.id));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateTask({
        taskId: task.id,
        title,
        description: description || null,
        state,
        priority,
        dueDate: dueDate || null,
        estimatedHours: hours === "" ? null : Number(hours),
        blockedReason: blockedReason || null,
      });
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title="Detalle de la tarea" variant="side">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="task-title" className={labelClass}>
            Título
          </label>
          <input id="task-title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
        </div>

        <div>
          <label htmlFor="task-description" className={labelClass}>
            Descripción
          </label>
          <textarea
            id="task-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-input border border-input-border bg-white px-3 py-2 text-base sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2">
          <div>
            <label htmlFor="task-state" className={labelClass}>
              Estado
            </label>
            <select id="task-state" value={state} onChange={(e) => setState(e.target.value as TaskState)} className={fieldClass}>
              {Object.entries(taskStateLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-priority" className={labelClass}>
              Prioridad
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className={fieldClass}
            >
              {Object.entries(priorityLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-date" className={labelClass}>
              Fecha
            </label>
            <input id="task-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="task-hours" className={labelClass}>
              Horas estimadas
            </label>
            <input
              id="task-hours"
              type="number"
              min={0}
              max={9999.9}
              step={0.5}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        {state === "blocked" && (
          <div>
            <label htmlFor="task-blocked" className={labelClass}>
              Motivo del bloqueo
            </label>
            <input
              id="task-blocked"
              maxLength={300}
              value={blockedReason}
              onChange={(e) => setBlockedReason(e.target.value)}
              className={fieldClass}
            />
          </div>
        )}

        <div>
          <h3 className={labelClass}>Recursos vinculados</h3>
          {linked.length === 0 ? (
            <p className="text-sm text-muted">Esta tarea no tiene recursos vinculados.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {linked.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-semibold">{r.name}</span>
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${r.name} (abre en una pestaña nueva)`}
                      className="text-muted hover:text-ink"
                    >
                      <ExternalLink size={16} strokeWidth={1.9} aria-hidden />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-line pt-4">
          <Button type="button" variant="text" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
