"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  addNote,
  addSection,
  deleteNote,
  deleteSection,
  getQuickTaskDetail,
  renameSection,
  updateNote,
  type DetailNote,
  type DetailResult,
  type DetailSection,
} from "@/app/(app)/pendientes/detail-actions";
import type { ActionResult } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import { formatDateTime } from "@/lib/domain/dates";
import type { QuickTask } from "@/lib/domain/pendientes";
import { fieldClass, labelClass } from "@/lib/ui-colors";

const textareaClass = "w-full rounded-input border border-input-border bg-white px-3 py-2 text-base sm:text-sm";
const dangerButton =
  "inline-flex h-10 items-center justify-center rounded-button bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60 lg:h-[38px]";

type Mutate = (fn: () => Promise<ActionResult>) => void;

/** Panel de un pendiente: notas generales y secciones con título, cada una con sus notas. */
export function QuickTaskDetail({ task, onClose }: { task: QuickTask; onClose: () => void }) {
  const [sections, setSections] = useState<DetailSection[]>([]);
  const [notes, setNotes] = useState<DetailNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [sectionTitle, setSectionTitle] = useState("");

  const apply = useCallback((result: DetailResult) => {
    if (!result.ok) return setError(result.error);
    setError(null);
    setSections(result.sections);
    setNotes(result.notes);
    setLoaded(true);
  }, []);

  const load = useCallback(async () => apply(await getQuickTaskDetail({ quickTaskId: task.id })), [apply, task.id]);

  useEffect(() => {
    let cancelled = false;
    getQuickTaskDetail({ quickTaskId: task.id }).then((result) => {
      if (!cancelled) apply(result);
    });
    return () => {
      cancelled = true;
    };
  }, [apply, task.id]);

  const mutate: Mutate = (fn) => {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) return toast(result.error, "error");
      await load();
    });
  };

  const general = notes.filter((n) => n.sectionId === null);

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      variant="side"
      title={task.title}
      description={`Creado el ${formatDateTime(task.createdAt)} · la fecha de creación no se puede editar`}
    >
      {error ? (
        <p role="alert" className="rounded-card bg-[#FDECEA] px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : !loaded ? (
        <p aria-busy="true" className="text-sm text-muted">
          Cargando…
        </p>
      ) : (
        <div className="flex flex-col gap-6" aria-busy={pending}>
          <section aria-labelledby="detalle-generales">
            <h3 id="detalle-generales" className="mb-2 text-base font-extrabold">
              Notas
            </h3>
            <NoteList notes={general} quickTaskId={task.id} sectionId={null} mutate={mutate} pending={pending} idPrefix="general" />
          </section>

          {sections.map((s) => (
            <SectionBlock
              key={s.id}
              section={s}
              notes={notes.filter((n) => n.sectionId === s.id)}
              quickTaskId={task.id}
              mutate={mutate}
              pending={pending}
            />
          ))}

          <form
            aria-label="Agregar sección"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const t = sectionTitle.trim();
              if (!t) return;
              mutate(() => addSection({ quickTaskId: task.id, title: t }));
              setSectionTitle("");
            }}
            className="border-t border-line pt-4"
          >
            <label htmlFor="detalle-nueva-seccion" className={labelClass}>
              Nueva sección
            </label>
            <div className="flex gap-2">
              <input
                id="detalle-nueva-seccion"
                value={sectionTitle}
                maxLength={80}
                autoComplete="off"
                placeholder="Ej.: Contactos, Pasos, Pendientes con Compras"
                onChange={(e) => setSectionTitle(e.target.value)}
                className={fieldClass}
              />
              <Button type="submit" disabled={pending || !sectionTitle.trim()}>
                <Plus size={18} strokeWidth={1.9} aria-hidden />
                Agregar
              </Button>
            </div>
          </form>
        </div>
      )}
    </Dialog>
  );
}

function SectionBlock({
  section,
  notes,
  quickTaskId,
  mutate,
  pending,
}: {
  section: DetailSection;
  notes: DetailNote[];
  quickTaskId: string;
  mutate: Mutate;
  pending: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(section.title);
  const [confirming, setConfirming] = useState(false);

  return (
    <section aria-labelledby={`seccion-${section.id}`} className="rounded-card border border-line p-3.5">
      {renaming ? (
        <form
          noValidate
          aria-label={`Renombrar sección ${section.title}`}
          onSubmit={(e) => {
            e.preventDefault();
            const t = draft.trim();
            if (!t) return;
            mutate(() => renameSection({ id: section.id, title: t }));
            setRenaming(false);
          }}
          className="mb-3 flex flex-col gap-2"
        >
          <label htmlFor={`seccion-titulo-${section.id}`} className={labelClass}>
            Título de la sección
          </label>
          <input
            id={`seccion-titulo-${section.id}`}
            autoFocus
            value={draft}
            maxLength={80}
            onChange={(e) => setDraft(e.target.value)}
            className={fieldClass}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="text" onClick={() => setRenaming(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !draft.trim()}>
              Guardar
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 id={`seccion-${section.id}`} className="min-w-0 flex-1 text-base font-extrabold break-words">
            {section.title}
          </h3>
          <div className="-mr-1.5 -mt-1.5 flex shrink-0">
            <Button
              type="button"
              variant="text"
              aria-label={`Renombrar sección ${section.title}`}
              onClick={() => {
                setDraft(section.title);
                setConfirming(false);
                setRenaming(true);
              }}
            >
              <Pencil size={16} strokeWidth={1.9} aria-hidden />
            </Button>
            <Button
              type="button"
              variant="text"
              aria-label={`Eliminar sección ${section.title}`}
              className="hover:!text-danger"
              onClick={() => setConfirming(true)}
            >
              <Trash2 size={16} strokeWidth={1.9} aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {confirming && (
        <div role="alert" className="mb-3 rounded-input bg-[#FDECEA] p-3 text-sm">
          ¿Eliminar la sección <strong>«{section.title}»</strong>
          {notes.length > 0 ? ` y sus ${notes.length} ${notes.length === 1 ? "nota" : "notas"}` : ""}? No se puede deshacer.
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="text" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <button type="button" disabled={pending} className={dangerButton} onClick={() => mutate(() => deleteSection({ id: section.id }))}>
              Eliminar sección
            </button>
          </div>
        </div>
      )}

      <NoteList notes={notes} quickTaskId={quickTaskId} sectionId={section.id} mutate={mutate} pending={pending} idPrefix={section.id} />
    </section>
  );
}

function NoteList({
  notes,
  quickTaskId,
  sectionId,
  mutate,
  pending,
  idPrefix,
}: {
  notes: DetailNote[];
  quickTaskId: string;
  sectionId: string | null;
  mutate: Mutate;
  pending: boolean;
  idPrefix: string;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex flex-col gap-3">
      {notes.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay notas aquí.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {notes.map((n) => (
            <NoteItem key={n.id} note={n} mutate={mutate} pending={pending} />
          ))}
        </ul>
      )}

      <form
        noValidate
        aria-label={sectionId ? "Agregar nota a la sección" : "Agregar nota general"}
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (!body) return;
          mutate(() => addNote({ quickTaskId, sectionId, body }));
          setDraft("");
        }}
      >
        <label htmlFor={`nota-${idPrefix}`} className="sr-only">
          Nueva nota
        </label>
        <textarea
          id={`nota-${idPrefix}`}
          rows={2}
          maxLength={5000}
          value={draft}
          placeholder="Escribe una nota…"
          onChange={(e) => setDraft(e.target.value)}
          className={textareaClass}
        />
        <div className="mt-2 flex justify-end">
          <Button type="submit" variant="secondary" disabled={pending || !draft.trim()}>
            <Plus size={16} strokeWidth={1.9} aria-hidden />
            Agregar nota
          </Button>
        </div>
      </form>
    </div>
  );
}

function NoteItem({ note, mutate, pending }: { note: DetailNote; mutate: Mutate; pending: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const [confirming, setConfirming] = useState(false);
  const edited = note.updatedAt !== note.createdAt;

  if (editing) {
    return (
      <li>
        <form
          noValidate
          aria-label="Editar nota"
          onSubmit={(e) => {
            e.preventDefault();
            const body = draft.trim();
            if (!body) return;
            mutate(() => updateNote({ id: note.id, body }));
            setEditing(false);
          }}
        >
          <label htmlFor={`editar-nota-${note.id}`} className="sr-only">
            Texto de la nota
          </label>
          <textarea
            id={`editar-nota-${note.id}`}
            autoFocus
            rows={3}
            maxLength={5000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={textareaClass}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="text" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || !draft.trim()}>
              Guardar
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-input bg-surface px-3 py-2.5">
      <p className="text-sm whitespace-pre-wrap break-words">{note.body}</p>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
        <span className="text-xs text-muted">
          {formatDateTime(note.createdAt)}
          {edited ? " · editada" : ""}
        </span>
        {confirming ? (
          <span className="flex items-center gap-1">
            <span className="text-xs font-semibold">¿Eliminar nota?</span>
            <Button type="button" variant="text" onClick={() => setConfirming(false)}>
              No
            </Button>
            <button type="button" disabled={pending} className={dangerButton} onClick={() => mutate(() => deleteNote({ id: note.id }))}>
              Sí, eliminar
            </button>
          </span>
        ) : (
          <span className="-mr-2 flex">
            <Button
              type="button"
              variant="text"
              aria-label="Editar nota"
              onClick={() => {
                setDraft(note.body);
                setEditing(true);
              }}
            >
              <Pencil size={15} strokeWidth={1.9} aria-hidden />
            </Button>
            <Button type="button" variant="text" aria-label="Eliminar nota" className="hover:!text-danger" onClick={() => setConfirming(true)}>
              <Trash2 size={15} strokeWidth={1.9} aria-hidden />
            </Button>
          </span>
        )}
      </div>
    </li>
  );
}
