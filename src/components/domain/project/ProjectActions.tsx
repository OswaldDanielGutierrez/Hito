"use client";

import { useState, useTransition } from "react";
import {
  archiveProject,
  changeProjectStatus,
  deleteProject,
  restoreProject,
  saveAsTemplate,
  updateProject,
} from "@/app/(app)/proyectos/actions";
import { Button, buttonClass } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import type { ProjectInfo } from "@/lib/data/project";
import type { ProjectStatus } from "@/lib/domain/types";
import { projectStatusLabel } from "@/lib/labels";
import { fieldClass, labelClass } from "@/lib/ui-colors";

type ProjectFields = Pick<ProjectInfo, "id" | "name" | "area" | "description" | "responsible" | "startDate" | "status">;

export function ProjectActions({
  project,
  pendingPhases,
  hasPhases,
}: {
  project: ProjectFields;
  pendingPhases: number;
  hasPhases: boolean;
}) {
  const [dialog, setDialog] = useState<"status" | "edit" | null>(null);

  return (
    <>
      <button type="button" className={`${buttonClass("secondary")} flex-1 sm:flex-none`} onClick={() => setDialog("status")}>
        Cambiar estado
      </button>
      <button type="button" className={`${buttonClass("primary")} flex-1 sm:flex-none`} onClick={() => setDialog("edit")}>
        Editar proyecto
      </button>
      {dialog === "status" && (
        <ChangeStatusDialog project={project} pendingPhases={pendingPhases} onClose={() => setDialog(null)} />
      )}
      {dialog === "edit" && (
        <EditProjectDialog project={project} canSaveTemplate={hasPhases} onClose={() => setDialog(null)} />
      )}
    </>
  );
}

function ChangeStatusDialog({
  project,
  pendingPhases,
  onClose,
}: {
  project: ProjectFields;
  pendingPhases: number;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [note, setNote] = useState("");
  const [completePending, setCompletePending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const suggestCompleting = status === "delivered" && project.status !== "delivered" && pendingPhases > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await changeProjectStatus({
        projectId: project.id,
        status,
        note,
        completePending: suggestCompleting && completePending,
      });
      if (result.ok) {
        toast("Estado actualizado");
        onClose();
      }
      else setError(result.error);
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title="Cambiar estado" description={project.name}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="status-select" className={labelClass}>
            Nuevo estado
          </label>
          <select id="status-select" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className={fieldClass}>
            {(Object.keys(projectStatusLabel) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>
                {projectStatusLabel[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status-note" className={labelClass}>
            Nota (opcional)
          </label>
          <textarea
            id="status-note"
            rows={3}
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-input border border-input-border bg-white px-3 py-2 text-base sm:text-sm"
          />
        </div>

        {suggestCompleting && (
          <label className="flex items-start gap-2 rounded-button bg-[#FDF0E3] px-3.5 py-2.5 text-sm text-warn">
            <input
              type="checkbox"
              checked={completePending}
              onChange={(e) => setCompletePending(e.target.checked)}
              className="mt-0.5 size-4 accent-green-700"
            />
            <span>
              Marcar como completadas las {pendingPhases} {pendingPhases === 1 ? "fase pendiente" : "fases pendientes"}.
            </span>
          </label>
        )}

        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="text" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending || status === project.status}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function EditProjectDialog({
  project,
  canSaveTemplate,
  onClose,
}: {
  project: ProjectFields;
  canSaveTemplate: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [area, setArea] = useState(project.area ?? "");
  const [description, setDescription] = useState(project.description ?? "");
  const [responsible, setResponsible] = useState(project.responsible ?? "");
  const [startDate, setStartDate] = useState(project.startDate ?? "");
  const [templateName, setTemplateName] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    startTransition(async () => {
      const result = await updateProject({
        projectId: project.id,
        name,
        area,
        description,
        responsible,
        startDate: startDate || null,
      });
      if (result.ok) {
        toast("Cambios guardados");
        onClose();
      }
      else setError(result.error);
    });
  }

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>, success?: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
      else if (success) setNotice(success);
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title="Editar proyecto" description={project.name} variant="wide">
      <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="ep-name" className={labelClass}>
            Nombre
          </label>
          <input id="ep-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="ep-area" className={labelClass}>
            Área
          </label>
          <input id="ep-area" maxLength={120} value={area} onChange={(e) => setArea(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="ep-responsible" className={labelClass}>
            Responsable
          </label>
          <input id="ep-responsible" maxLength={120} value={responsible} onChange={(e) => setResponsible(e.target.value)} className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ep-description" className={labelClass}>
            Descripción
          </label>
          <textarea
            id="ep-description"
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-input border border-input-border bg-white px-3 py-2 text-base sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="ep-start" className={labelClass}>
            Fecha de inicio
          </label>
          <input id="ep-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClass} />
        </div>
        <div className="flex justify-end gap-3 sm:col-span-2">
          <Button type="button" variant="text" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </form>

      <section aria-labelledby="ep-plantilla" className="mt-6 border-t border-line pt-5">
        <h3 id="ep-plantilla" className="mb-1 text-sm font-extrabold">
          Guardar como plantilla
        </h3>
        <p className="mb-3 text-[13px] text-muted">
          Guarda las fases de este proyecto con sus desplazamientos desde la fecha de inicio para reutilizarlas al registrar otros.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="ep-template" className="sr-only">
            Nombre de la plantilla
          </label>
          <input
            id="ep-template"
            maxLength={80}
            placeholder="Nombre de la plantilla"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className={fieldClass}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={pending || !canSaveTemplate || !templateName.trim()}
            onClick={() => run(() => saveAsTemplate({ projectId: project.id, name: templateName }), "Plantilla guardada.")}
          >
            Guardar plantilla
          </Button>
        </div>
      </section>

      <section aria-labelledby="ep-peligro" className="mt-6 border-t border-line pt-5">
        <h3 id="ep-peligro" className="mb-3 text-sm font-extrabold">
          Archivar o eliminar
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" disabled={pending} onClick={() => run(() => archiveProject({ projectId: project.id }))}>
            Archivar proyecto
          </Button>
          <span className="text-[13px] text-muted">Lo oculta de Inicio. Se puede restaurar abriendo su enlace.</span>
        </div>

        {!deleting ? (
          <button type="button" onClick={() => setDeleting(true)} className="mt-4 text-sm font-bold text-danger hover:underline">
            Eliminar proyecto…
          </button>
        ) : (
          <div className="mt-4 rounded-card border border-[#F2C3BE] bg-[#FDECEA] p-4">
            <p className="mb-2 text-sm font-semibold text-danger">
              Esto elimina para siempre el proyecto, sus fases, tareas, recursos e historial.
            </p>
            <label htmlFor="ep-confirm" className={labelClass}>
              Escribe «{project.name}» para confirmar
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input id="ep-confirm" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} className={fieldClass} />
              <button
                type="button"
                disabled={pending || confirmName.trim() !== project.name}
                onClick={() => run(() => deleteProject({ projectId: project.id, confirmName }))}
                className="h-[38px] shrink-0 rounded-button bg-danger px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        )}
      </section>

      {notice && (
        <p role="status" className="mt-4 text-sm font-medium text-green-700-hover">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </Dialog>
  );
}

export function ArchivedNotice({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div role="status" className="flex flex-wrap items-center gap-3 bg-[#FDF0E3] px-4 sm:px-8 py-2.5 text-[13px] font-semibold text-warn">
      <span>Este proyecto está archivado y no aparece en Inicio.</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await restoreProject({ projectId });
            if (!result.ok) setError(result.error);
          })
        }
        className="font-bold text-green-700-hover underline disabled:opacity-60"
      >
        {pending ? "Restaurando…" : "Restaurar"}
      </button>
      {error && <span className="text-danger">{error}</span>}
    </div>
  );
}
