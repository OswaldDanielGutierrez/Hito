"use client";

import { Plus } from "lucide-react";
import { useState, type RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { addDays } from "@/lib/domain/dates";
import { fridayOfWeek, SELF_NAME } from "@/lib/domain/pendientes";
import { PriorityToggle, ProjectSelect, RequesterInput, Segmented } from "./QuickFields";

export type DateKey = "today" | "tomorrow" | "week" | "none";

export const DATE_OPTIONS: { value: DateKey; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "tomorrow", label: "Mañana" },
  { value: "week", label: "Esta semana" },
  { value: "none", label: "Sin fecha" },
];

export function resolveDate(key: DateKey, today: string): string | null {
  if (key === "today") return today;
  if (key === "tomorrow") return addDays(today, 1);
  if (key === "week") return fridayOfWeek(today);
  return null;
}

export interface NewQuickTask {
  title: string;
  projectId: string | null;
  requestedBy: string;
  dueDate: string | null;
  priority: "high" | "medium";
}

export function Composer({
  projects,
  requesters,
  today,
  inputRef,
  onAdd,
}: {
  projects: { id: string; name: string }[];
  requesters: string[];
  today: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onAdd: (task: NewQuickTask) => void;
}) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [dateKey, setDateKey] = useState<DateKey>("today");
  const [high, setHigh] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    onAdd({
      title: clean,
      projectId: projectId || null,
      requestedBy: requestedBy.trim() || SELF_NAME,
      dueDate: resolveDate(dateKey, today),
      priority: high ? "high" : "medium",
    });
    // Se conservan proyecto, solicitante y fecha para capturar varios seguidos.
    setTitle("");
    setHigh(false);
  }

  return (
    <form
      onSubmit={submit}
      aria-label="Agregar un pendiente"
      className="rounded-[16px] border-2 border-green-200 bg-white px-4 py-4 shadow-[0_4px_16px_rgba(2,44,23,.06)] focus-within:border-green-700 sm:px-[18px]"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
          <Plus size={18} strokeWidth={1.9} />
        </span>
        <label htmlFor="pendiente-titulo" className="sr-only">
          Título del pendiente
        </label>
        <input
          id="pendiente-titulo"
          ref={inputRef}
          value={title}
          maxLength={200}
          autoComplete="off"
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Qué te pidieron? Escríbelo y presiona Enter"
          className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:font-medium sm:text-[17px]"
        />
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-2.5 border-t border-surface pt-3.5">
        <ProjectSelect id="pendiente-proyecto" value={projectId} projects={projects} onChange={setProjectId} />
        <RequesterInput id="pendiente-pidio" value={requestedBy} requesters={requesters} onChange={setRequestedBy} />
        <Segmented label="Fecha" value={dateKey} options={DATE_OPTIONS} onChange={setDateKey} />
        <PriorityToggle pressed={high} onChange={setHigh} />
        <Button type="submit" className="w-full sm:ml-auto sm:w-auto">
          <Plus size={18} strokeWidth={1.9} aria-hidden />
          Agregar
        </Button>
      </div>
    </form>
  );
}
