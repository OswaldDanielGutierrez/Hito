"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { addNote, deleteNote, updateNote } from "@/app/(app)/pendientes/[id]/actions";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import type { ActionResult } from "@/lib/actions";
import { formatDateTime } from "@/lib/domain/dates";

export interface TaskNoteView {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

const textareaClass = "w-full rounded-input border border-input-border bg-white px-3 py-2 text-base sm:text-sm";
const dangerButton =
  "inline-flex h-10 items-center justify-center rounded-button bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60 lg:h-[38px]";

/** Notas importantes del pendiente: cortas, a la vista en la columna derecha. */
export function TaskNotes({ quickTaskId, notes }: { quickTaskId: string; notes: TaskNoteView[] }) {
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  function mutate(fn: () => Promise<ActionResult>, onOk?: () => void) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) return toast(result.error, "error");
      onOk?.();
    });
  }

  return (
    <section aria-labelledby="notas-importantes" className="rounded-card border border-line bg-white p-4">
      <h2 id="notas-importantes" className="text-base font-extrabold">
        Notas importantes
      </h2>
      <p className="mb-3 text-[13px] text-muted">Lo que no debes olvidar de este pendiente.</p>

      {notes.length === 0 ? (
        <p className="mb-3 text-sm text-muted">Aún no hay notas importantes.</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-2.5">
          {notes.map((n) => (
            <NoteItem key={n.id} note={n} pending={pending} mutate={mutate} />
          ))}
        </ul>
      )}

      <form
        noValidate
        aria-label="Agregar nota importante"
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (!body) return;
          mutate(() => addNote({ quickTaskId, body }), () => setDraft(""));
        }}
      >
        <label htmlFor="nueva-nota-importante" className="sr-only">
          Nueva nota importante
        </label>
        <textarea
          id="nueva-nota-importante"
          rows={2}
          maxLength={5000}
          value={draft}
          placeholder="Escribe una nota importante…"
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
    </section>
  );
}

function NoteItem({
  note,
  pending,
  mutate,
}: {
  note: TaskNoteView;
  pending: boolean;
  mutate: (fn: () => Promise<ActionResult>, onOk?: () => void) => void;
}) {
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
            mutate(() => updateNote({ id: note.id, body }), () => setEditing(false));
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
      <p className="text-sm break-words whitespace-pre-wrap">{note.body}</p>
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
