"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { formatDateTime } from "@/lib/domain/dates";
import type { QuickTask } from "@/lib/domain/pendientes";
import type { TagWithUsage } from "@/lib/domain/tags";
import { TagPicker } from "../tags/TagPicker";
import { fieldClass, labelClass } from "@/lib/ui-colors";
import { PriorityToggle, ProjectSelect, RequesterInput } from "./QuickFields";

export interface QuickTaskPatch {
  title: string;
  projectId: string | null;
  requestedBy: string;
  dueDate: string | null;
  priority: "high" | "medium";
  tagIds: string[];
}

export function EditDialog({
  task,
  projects,
  tags,
  requesters,
  onSave,
  onClose,
}: {
  task: QuickTask;
  projects: { id: string; name: string }[];
  tags: TagWithUsage[];
  requesters: string[];
  onSave: (patch: QuickTaskPatch) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [projectId, setProjectId] = useState(task.projectId ?? "");
  const [requestedBy, setRequestedBy] = useState(task.requestedBy);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [high, setHigh] = useState(task.priority === "high");
  const [tagIds, setTagIds] = useState(task.tagIds);

  // Si el proyecto ya no está activo (entregado o archivado), se conserva como opción para no perderlo.
  const options =
    task.projectId && !projects.some((p) => p.id === task.projectId)
      ? [...projects, { id: task.projectId, name: task.projectName ?? "Proyecto" }]
      : projects;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      projectId: projectId || null,
      requestedBy: requestedBy.trim() || "Yo",
      dueDate: dueDate || null,
      priority: high ? "high" : "medium",
      tagIds: tagIds.filter((id) => tags.some((t) => t.id === id)),
    });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title="Editar pendiente" description={task.title}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="edit-pendiente-titulo" className={labelClass}>
            Título
          </label>
          <input
            id="edit-pendiente-titulo"
            required
            autoFocus
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={fieldClass}
          />
        </div>

        <p className="-mt-2 text-xs text-muted">Creado el {formatDateTime(task.createdAt)} · la fecha de creación no se puede editar</p>

        <div className="flex flex-wrap gap-2.5">
          <ProjectSelect id="edit-pendiente-proyecto" value={projectId} projects={options} onChange={setProjectId} />
          <RequesterInput id="edit-pendiente-pidio" value={requestedBy} requesters={requesters} onChange={setRequestedBy} />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="edit-pendiente-fecha" className={labelClass}>
              Fecha
            </label>
            <input
              id="edit-pendiente-fecha"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`${fieldClass} !w-auto`}
            />
          </div>
          {dueDate && (
            <Button type="button" variant="text" onClick={() => setDueDate("")}>
              Quitar fecha
            </Button>
          )}
          <div className="sm:ml-auto">
            <PriorityToggle pressed={high} onChange={setHigh} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TagPicker id="edit-pendiente-etiquetas" tags={tags} selectedIds={tagIds} onChange={setTagIds} />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="text" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            Guardar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
