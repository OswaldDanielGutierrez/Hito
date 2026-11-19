"use client";

import { Key, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { addLinkResource, togglePinResource } from "@/app/(app)/proyectos/[id]/recursos/actions";
import { Button } from "@/components/ui/Button";
import type { ContactData, NoteData, ResourceData } from "@/lib/data/project";
import { countByFilter, matchesResourceFilter, RESOURCE_FILTERS, type ResourceFilter } from "@/lib/domain/resourceFilters";
import { ContactsCard } from "./ContactsCard";
import { NotesCard } from "./NotesCard";
import { AddResourceDialog, DeleteResourceDialog, EditResourceDialog, type PhaseOption } from "./ResourceDialogs";
import { ResourceCard } from "./ResourceCard";
import { UploadZone } from "./UploadZone";
import { uploadProjectFile } from "./upload";

export function ResourcesBoard({
  projectId,
  userId,
  phases,
  resources,
  notes,
  contacts,
}: {
  projectId: string;
  userId: string;
  phases: PhaseOption[];
  resources: ResourceData[];
  notes: NoteData[];
  contacts: ContactData[];
}) {
  const [filter, setFilter] = useState<ResourceFilter>("all");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ResourceData | null>(null);
  const [deleting, setDeleting] = useState<ResourceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const counts = countByFilter(resources);
  const visible = resources.filter((r) => matchesResourceFilter(r.kind, filter));
  const phaseName = (id: string | null) => phases.find((p) => p.id === id)?.name ?? null;

  function quickAddFiles(files: File[]) {
    setError(null);
    startTransition(async () => {
      const failures: string[] = [];
      for (const file of files) {
        const result = await uploadProjectFile({ file, projectId, userId, phaseId: null });
        if (!result.ok) failures.push(result.error);
      }
      if (failures.length > 0) setError(failures.join(" "));
    });
  }

  function quickAddLink(url: string) {
    setError(null);
    startTransition(async () => {
      const result = await addLinkResource({ projectId, url });
      if (!result.ok) setError(result.error);
    });
  }

  function togglePin(resource: ResourceData) {
    setError(null);
    startTransition(async () => {
      const result = await togglePinResource({ resourceId: resource.id, pinned: !resource.pinned });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_340px] min-[1100px]:gap-[22px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Filtrar recursos por tipo" className="flex flex-wrap gap-2">
            {RESOURCE_FILTERS.map(({ value, label }) => {
              const active = value === filter;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(value)}
                  className={`rounded-pill border px-3.5 py-[7px] text-[13px] font-semibold transition-colors duration-[120ms] ease-out ${
                    active ? "border-green-900 bg-green-900 text-white" : "border-line bg-white text-ink hover:border-input-border"
                  }`}
                >
                  {label} <span className="opacity-75">{counts[value]}</span>
                </button>
              );
            })}
          </div>
          <Button className="w-full sm:ml-auto sm:w-auto" onClick={() => setAdding(true)}>
            <Plus size={18} strokeWidth={1.9} aria-hidden />
            Agregar recurso
          </Button>
        </div>

        {error && (
          <p role="alert" className="rounded-button bg-[#FDECEA] px-3.5 py-2.5 text-sm font-semibold text-danger">
            {error}
          </p>
        )}

        {resources.length === 0 ? (
          <p className="rounded-card border border-line bg-white p-5 text-sm text-muted">
            Este proyecto aún no tiene recursos. Pega un enlace o arrastra un archivo para empezar.
          </p>
        ) : visible.length === 0 ? (
          <p className="rounded-card border border-line bg-white p-5 text-sm text-muted">No hay recursos de este tipo.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 min-[1500px]:grid-cols-3">
            {visible.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                projectId={projectId}
                phaseName={phaseName(r.phaseId)}
                onEdit={() => setEditing(r)}
                onTogglePin={() => togglePin(r)}
                onDelete={() => setDeleting(r)}
              />
            ))}
          </ul>
        )}

        <UploadZone busy={busy} onFiles={quickAddFiles} onLink={quickAddLink} />
      </div>

      <aside aria-label="Notas y contactos" className="flex min-w-0 flex-col gap-4">
        <NotesCard projectId={projectId} notes={notes} />
        <ContactsCard projectId={projectId} contacts={contacts} />
        <p className="flex gap-2.5 rounded-card bg-green-50 p-4 text-[13px] leading-5 text-green-800">
          <Key size={18} strokeWidth={1.9} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            <strong>Accesos:</strong> aquí solo registras dónde está cada credencial (por ejemplo, tu gestor de contraseñas). La app
            nunca guarda contraseñas.
          </span>
        </p>
      </aside>

      {adding && <AddResourceDialog projectId={projectId} userId={userId} phases={phases} onClose={() => setAdding(false)} />}
      {editing && <EditResourceDialog key={editing.id} resource={editing} phases={phases} onClose={() => setEditing(null)} />}
      {deleting && <DeleteResourceDialog key={deleting.id} resource={deleting} onClose={() => setDeleting(null)} />}
    </div>
  );
}
