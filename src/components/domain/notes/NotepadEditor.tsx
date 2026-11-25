"use client";

import { useEffect, useRef, useState } from "react";
import { saveQuickTaskNotepad } from "@/app/(app)/pendientes/[id]/actions";
import { saveNotepad } from "@/app/(app)/proyectos/[id]/notas/actions";
import type { ActionResult } from "@/lib/actions";

const MAX = 50000;
const DEBOUNCE_MS = 800;

type Status = "saved" | "dirty" | "saving" | "error";

const statusText: Record<Status, string> = {
  saved: "Guardado",
  dirty: "Sin guardar…",
  saving: "Guardando…",
  error: "No se pudo guardar",
};

type Kind = "project" | "quick";

const COPY: Record<Kind, { title: string; hint: string; label: string; placeholder: string }> = {
  project: {
    title: "Bloc de notas",
    hint: "Apuntes e ideas sueltas del proyecto. Se guardan solos.",
    label: "Bloc de notas del proyecto",
    placeholder: "Escribe aquí lo que quieras: ideas, pendientes, enlaces, apuntes de reuniones…",
  },
  quick: {
    title: "Escritura libre",
    hint: "Anota ideas, pasos y apuntes de este pendiente. Se guarda solo.",
    label: "Escritura libre del pendiente",
    placeholder: "Escribe aquí lo que quieras: ideas, pasos, apuntes de la conversación…",
  },
};

const save = (kind: Kind, id: string, content: string): Promise<ActionResult> =>
  kind === "project" ? saveNotepad({ projectId: id, content }) : saveQuickTaskNotepad({ id, content });

/** Bloc de texto libre con autoguardado, para proyectos (`project`) y pendientes (`quick`). */
export function NotepadEditor({ kind = "project", id, initial }: { kind?: Kind; id: string; initial: string }) {
  const copy = COPY[kind];
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<Status>("saved");
  const [error, setError] = useState<string | null>(null);

  const latest = useRef(initial);
  const saved = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function flush() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (latest.current === saved.current) return;

    const content = latest.current;
    setStatus("saving");
    const result = await save(kind, id, content);
    if (result.ok) {
      saved.current = content;
      setError(null);
      setStatus(latest.current === content ? "saved" : "dirty");
    } else {
      setError(result.error);
      setStatus("error");
    }
  }

  function onChange(next: string) {
    latest.current = next;
    setValue(next);
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, DEBOUNCE_MS);
  }

  // Al salir de la pestaña se guarda lo pendiente para no perder lo último escrito.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (latest.current !== saved.current) void save(kind, id, latest.current);
    };
  }, [kind, id]);

  return (
    <section aria-labelledby="notas-bloc-titulo" className="rounded-card border border-line bg-white p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h2 id="notas-bloc-titulo" className="text-base font-extrabold">
            {copy.title}
          </h2>
          <p className="text-[13px] text-muted">{copy.hint}</p>
        </div>
        <p
          role="status"
          aria-live="polite"
          className={`text-xs font-semibold ${status === "error" ? "text-danger" : status === "saved" ? "text-green-700-hover" : "text-muted"}`}
        >
          {statusText[status]}
        </p>
      </div>

      <label htmlFor="bloc-notas" className="sr-only">
        {copy.label}
      </label>
      <textarea
        id="bloc-notas"
        value={value}
        maxLength={MAX}
        onChange={(e) => onChange(e.target.value)}
        onBlur={flush}
        placeholder={copy.placeholder}
        className="block min-h-[55dvh] w-full resize-y rounded-input border border-line bg-page p-3.5 text-base leading-7 sm:text-sm sm:leading-6"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {value.length.toLocaleString("es-CO")} / {MAX.toLocaleString("es-CO")} caracteres
        </span>
        {error && (
          <span role="alert" className="font-semibold text-danger">
            {error}
          </span>
        )}
      </div>
    </section>
  );
}
