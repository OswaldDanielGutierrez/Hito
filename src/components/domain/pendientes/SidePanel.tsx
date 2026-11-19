"use client";

import type { ReactNode } from "react";
import type { DayProgress, Tally } from "@/lib/domain/pendientes";

const card = "rounded-card border border-line bg-white";

export function ProgressCard({ progress }: { progress: DayProgress }) {
  const message =
    progress.total === 0
      ? "Sin pendientes para hoy"
      : progress.remaining === 0
        ? "Día completo"
        : `${progress.remaining} por terminar entre hoy y atrasados`;

  return (
    <section aria-labelledby="avance-titulo" className={`${card} px-5 py-[18px]`}>
      <h2 id="avance-titulo" className="text-xs font-medium text-muted">
        Avance de hoy
      </h2>
      <p className="mt-1 text-[30px] leading-9 font-extrabold">
        {progress.done}
        <span className="text-base font-medium text-muted"> de {progress.total}</span>
      </p>
      <p className="mt-0.5 text-xs font-semibold text-muted">{message}</p>

      {progress.cells.length > 0 && (
        <div role="img" aria-label={`${progress.done} de ${progress.total} pendientes de hoy hechos`} className="mt-3.5 flex flex-wrap gap-1.5">
          {progress.cells.map((cell, i) => (
            <span
              key={i}
              className={`h-4 w-7 rounded-[4px] ${
                cell === "done"
                  ? "bg-green-700"
                  : cell === "overdue"
                    ? "border-[1.5px] border-danger bg-[#FDECEA]"
                    : "border-[1.5px] border-input-border"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function TallyCard({
  title,
  rows,
  active,
  onToggle,
  leading,
  barColor,
  empty,
}: {
  title: string;
  rows: Tally[];
  active: string | null;
  onToggle: (key: string) => void;
  leading: (row: Tally) => ReactNode;
  barColor: (row: Tally) => string;
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  const id = `tally-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section aria-labelledby={id} className={`${card} px-3.5 py-3`}>
      <h2 id={id} className="px-1.5 pb-2 text-base font-extrabold">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="px-1.5 pb-1 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map((row) => {
            const isActive = active === row.key;
            return (
              <li key={row.key}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onToggle(row.key)}
                  className={`flex min-h-11 w-full flex-col gap-1.5 rounded-input border px-2 py-2 text-left transition-colors duration-[120ms] ease-out ${
                    isActive ? "border-green-700 bg-green-50" : "border-transparent hover:bg-page"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {leading(row)}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{row.label}</span>
                    <span className="text-[13px] font-extrabold">{row.count}</span>
                  </span>
                  <span aria-hidden className="block h-1.5 rounded-pill bg-surface">
                    <span className="block h-full rounded-pill" style={{ width: `${(row.count / max) * 100}%`, backgroundColor: barColor(row) }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
