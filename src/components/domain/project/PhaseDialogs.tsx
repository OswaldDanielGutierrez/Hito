"use client";

import { useState, useTransition } from "react";
import { addPhase, updatePhaseDate } from "@/app/(app)/proyectos/[id]/actions";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { PhaseData } from "@/lib/data/project";
import { addDays, diffDays, formatDate } from "@/lib/domain/dates";
import { fieldClass, labelClass } from "@/lib/ui-colors";

export function EditPhaseDateDialog({
  phase,
  followingCount,
  onClose,
}: {
  phase: PhaseData;
  followingCount: number;
  onClose: () => void;
}) {
  const [date, setDate] = useState(phase.estimatedDate ?? "");
  const [reason, setReason] = useState("");
  const [shift, setShift] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const delta = phase.estimatedDate && date ? diffDays(phase.estimatedDate, date) : 0;
  const changed = delta !== 0 || (!phase.estimatedDate && !!date);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return setError("Elige una fecha");
    startTransition(async () => {
      const result = await updatePhaseDate({ phaseId: phase.id, date, reason, shiftFollowing: shift && delta !== 0 });
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Entrega estimada"
      description={`Fase ${phase.name}${phase.originalDate ? ` · plan inicial ${formatDate(phase.originalDate)}` : ""}`}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="phase-date" className={labelClass}>
            Nueva fecha
          </label>
          <input id="phase-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
          {changed && delta !== 0 && (
            <p className="mt-1 text-xs font-semibold text-warn">
              {delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`} {Math.abs(delta) === 1 ? "día" : "días"} respecto a la fecha actual
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phase-reason" className={labelClass}>
            Motivo (opcional)
          </label>
          <textarea
            id="phase-reason"
            rows={3}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-input border border-input-border bg-white px-3 py-2 text-base sm:text-sm"
          />
        </div>

        {followingCount > 0 && delta !== 0 && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={shift} onChange={(e) => setShift(e.target.checked)} className="mt-0.5 size-4 accent-green-700" />
            <span>
              Desplazar {followingCount === 1 ? "la fase siguiente" : `las ${followingCount} fases siguientes`} los mismos{" "}
              {Math.abs(delta)} {Math.abs(delta) === 1 ? "día" : "días"}
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
          <Button type="submit" disabled={pending || !changed}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function NewPhaseDialog({
  projectId,
  lastDate,
  onClose,
}: {
  projectId: string;
  lastDate: string | null;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(lastDate ? addDays(lastDate, 7) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addPhase({ projectId, name, date });
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title="Nueva fase" description="Se agrega al final del proyecto.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="new-phase-name" className={labelClass}>
            Nombre
          </label>
          <input
            id="new-phase-name"
            required
            maxLength={80}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="new-phase-date" className={labelClass}>
            Entrega estimada
          </label>
          <input id="new-phase-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </div>

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
            {pending ? "Agregando…" : "Agregar fase"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
