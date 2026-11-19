"use client";

import { Flag } from "lucide-react";
import type { ReactNode } from "react";

/** Caja de 38 px con la etiqueta dentro y el control al lado (Proyecto, Pidió). */
export function FieldBox({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex h-10 min-w-0 items-center gap-2 rounded-input border border-input-border bg-white px-2.5 focus-within:border-green-700 sm:h-[38px]">
      <label htmlFor={htmlFor} className="shrink-0 text-xs font-semibold text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

const control = "min-w-0 flex-1 bg-transparent text-base font-semibold outline-none sm:text-[13px]";

export function ProjectSelect({
  id,
  value,
  projects,
  onChange,
}: {
  id: string;
  value: string;
  projects: { id: string; name: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <FieldBox label="Proyecto" htmlFor={id}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${control} max-w-[180px]`}>
        <option value="">Sin proyecto</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </FieldBox>
  );
}

export function RequesterInput({
  id,
  value,
  requesters,
  onChange,
}: {
  id: string;
  value: string;
  requesters: string[];
  onChange: (value: string) => void;
}) {
  const listId = `${id}-lista`;
  return (
    <FieldBox label="Pidió" htmlFor={id}>
      <input
        id={id}
        list={listId}
        value={value}
        maxLength={80}
        placeholder="Yo"
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={`${control} w-[120px] flex-none`}
      />
      <datalist id={listId}>
        {requesters.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
    </FieldBox>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="grid max-w-full grid-cols-2 gap-[2px] rounded-input bg-surface p-[3px] min-[480px]:flex">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`h-9 rounded-[6px] px-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors duration-[120ms] ease-out sm:h-8 ${
              active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function PriorityToggle({ pressed, onChange }: { pressed: boolean; onChange: (pressed: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onChange(!pressed)}
      className={`flex h-10 items-center gap-1.5 rounded-input border px-3 text-[13px] font-semibold transition-colors duration-[120ms] ease-out sm:h-[38px] ${
        pressed ? "border-danger bg-[#FDECEA] text-danger" : "border-input-border bg-white text-ink hover:bg-surface"
      }`}
    >
      <Flag size={16} strokeWidth={1.9} aria-hidden />
      Alta prioridad
    </button>
  );
}
