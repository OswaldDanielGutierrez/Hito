"use client";

import { useState, useTransition } from "react";
import { addLinkResource, deleteResource, updateResource } from "@/app/(app)/proyectos/[id]/recursos/actions";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import type { ResourceData } from "@/lib/data/project";
import { suggestResourceName } from "@/lib/domain/resourceDetect";
import { fieldClass, labelClass } from "@/lib/ui-colors";
import { MAX_FILE_MB, uploadProjectFile } from "./upload";

export interface PhaseOption {
  id: string;
  name: string;
}

function PhaseSelect({ id, value, onChange, phases }: { id: string; value: string; onChange: (v: string) => void; phases: PhaseOption[] }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        Fase (opcional)
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        <option value="">Sin fase</option>
        {phases.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AddResourceDialog({
  projectId,
  userId,
  phases,
  onClose,
}: {
  projectId: string;
  userId: string;
  phases: PhaseOption[];
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"link" | "file">("link");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phaseId, setPhaseId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      if (mode === "link") {
        const result = await addLinkResource({ projectId, url, name, phaseId: phaseId || null });
        if (result.ok) {
          toast("Enlace agregado");
          onClose();
        }
        else setError(result.error);
        return;
      }
      if (!file) return setError("Elige un archivo");
      const result = await uploadProjectFile({ file, projectId, userId, phaseId: phaseId || null });
      if (result.ok) {
        toast("Archivo subido");
        onClose();
      }
      else setError(result.error);
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title="Agregar recurso" description="Un enlace o un archivo del proyecto.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div role="group" aria-label="Tipo de recurso" className="grid grid-cols-2 gap-2 rounded-button bg-surface p-1">
          {(["link", "file"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`h-9 rounded-input text-sm font-semibold transition-colors duration-[120ms] ease-out ${
                mode === m ? "bg-white shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {m === "link" ? "Enlace" : "Archivo"}
            </button>
          ))}
        </div>

        {mode === "link" ? (
          <>
            <div>
              <label htmlFor="res-url" className={labelClass}>
                Enlace
              </label>
              <input
                id="res-url"
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/mi-organizacion/mi-repo"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="res-name" className={labelClass}>
                Nombre (opcional)
              </label>
              <input
                id="res-name"
                maxLength={160}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={suggestResourceName(url) || "Se sugiere según el enlace"}
                className={fieldClass}
              />
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="res-file" className={labelClass}>
              Archivo (máx. {MAX_FILE_MB} MB)
            </label>
            <input
              id="res-file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-base file:mr-3 file:h-10 file:rounded-button file:border file:border-input-border file:bg-white file:px-4 file:text-sm file:font-semibold sm:text-sm"
            />
          </div>
        )}

        <PhaseSelect id="res-phase" value={phaseId} onChange={setPhaseId} phases={phases} />

        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="text" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? (mode === "file" ? "Subiendo…" : "Agregando…") : "Agregar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function EditResourceDialog({
  resource,
  phases,
  onClose,
}: {
  resource: ResourceData;
  phases: PhaseOption[];
  onClose: () => void;
}) {
  const isFile = !!resource.storagePath;
  const [name, setName] = useState(resource.name);
  const [url, setUrl] = useState(resource.url ?? "");
  const [phaseId, setPhaseId] = useState(resource.phaseId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateResource({
        resourceId: resource.id,
        name,
        url: isFile ? undefined : url,
        phaseId: phaseId || null,
      });
      if (result.ok) {
        toast("Recurso actualizado");
        onClose();
      }
      else setError(result.error);
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title="Editar recurso" description={resource.name}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="edit-res-name" className={labelClass}>
            Nombre
          </label>
          <input id="edit-res-name" required maxLength={160} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </div>
        {!isFile && (
          <div>
            <label htmlFor="edit-res-url" className={labelClass}>
              Enlace
            </label>
            <input id="edit-res-url" value={url} onChange={(e) => setUrl(e.target.value)} className={fieldClass} />
          </div>
        )}
        <PhaseSelect id="edit-res-phase" value={phaseId} onChange={setPhaseId} phases={phases} />

        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
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

export function DeleteResourceDialog({ resource, onClose }: { resource: ResourceData; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Eliminar recurso"
      description={resource.storagePath ? "También se borra el archivo guardado." : "Solo se quita de este proyecto; el enlace original no se toca."}
    >
      <p className="mb-5 text-sm">
        ¿Eliminar <strong className="break-words">{resource.name}</strong>? Esta acción no se puede deshacer.
      </p>
      {error && (
        <p role="alert" className="mb-4 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="text" onClick={onClose}>
          Cancelar
        </Button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteResource({ resourceId: resource.id });
              if (result.ok) {
                toast("Recurso eliminado");
                onClose();
              }
              else setError(result.error);
            })
          }
          className="h-[38px] rounded-button bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Eliminando…" : "Eliminar"}
        </button>
      </div>
    </Dialog>
  );
}
