"use client";

import { Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { addNote, deleteNote, updateNote } from "@/app/(app)/proyectos/[id]/recursos/actions";
import type { ActionResult } from "@/lib/actions";
import type { NoteData } from "@/lib/data/project";
import { fieldClass } from "@/lib/ui-colors";

export function NotesCard({ projectId, notes }: { projectId: string; notes: NoteData[] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, onDone?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) onDone?.();
      else setError(result.error);
    });
  }

  return (
    <section aria-labelledby="notas-titulo" className="min-w-0 rounded-card border border-line bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="notas-titulo" className="text-base font-extrabold">
          Notas del proyecto
        </h2>
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="h-9 rounded-button px-3 text-[13px] font-bold text-green-700 hover:bg-green-50"
        >
          {editing ? "Listo" : "Editar"}
        </button>
      </div>

      {!editing ? (
        notes.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay notas. Usa «Editar» para agregar la primera.</p>
        ) : (
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-[22px]">
            {notes.map((n) => (
              <li key={n.id} className="break-words">
                {n.body}
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="flex flex-col gap-2.5">
          {notes.map((n, i) => (
            <div key={`${n.id}-${n.body}`} className="flex items-center gap-2">
              <input
                aria-label={`Nota ${i + 1}`}
                defaultValue={n.body}
                maxLength={1000}
                onBlur={(e) => {
                  const body = e.target.value.trim();
                  if (body && body !== n.body) run(() => updateNote({ noteId: n.id, body }));
                }}
                className={fieldClass}
              />
              <button
                type="button"
                aria-label={`Eliminar la nota ${i + 1}`}
                disabled={pending}
                onClick={() => run(() => deleteNote({ noteId: n.id }))}
                className="flex size-10 shrink-0 items-center justify-center rounded-input text-muted hover:bg-surface hover:text-danger sm:size-9"
              >
                <X size={18} strokeWidth={1.9} aria-hidden />
              </button>
            </div>
          ))}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              run(() => addNote({ projectId, body: draft }), () => setDraft(""));
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor="nueva-nota" className="sr-only">
              Nueva nota
            </label>
            <input
              id="nueva-nota"
              value={draft}
              maxLength={1000}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nueva nota y Enter"
              className={fieldClass}
            />
            <button
              type="submit"
              aria-label="Agregar nota"
              disabled={pending || !draft.trim()}
              className="flex size-10 shrink-0 items-center justify-center rounded-input bg-green-700 text-white hover:bg-green-700-hover disabled:opacity-50 sm:size-9"
            >
              <Plus size={18} strokeWidth={1.9} aria-hidden />
            </button>
          </form>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
