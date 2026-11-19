"use client";

import { useState, useTransition } from "react";
import { setAlertRule, setNotificationChannel } from "@/app/(app)/proyectos/[id]/historial/actions";
import { Switch } from "@/components/ui/Switch";
import type { ActionResult } from "@/lib/actions";
import type { ActivityData, AlertRuleData } from "@/lib/data/project";
import { formatDateTime } from "@/lib/domain/dates";
import { groupAlertRules, type AlertKind } from "@/lib/domain/alertRules";
import { changeKindLabel } from "@/lib/labels";
import { changeKindColors, fieldClass, labelClass } from "@/lib/ui-colors";

type KindFilter = "all" | ActivityData["kind"];

function KindPill({ kind }: { kind: ActivityData["kind"] }) {
  const { bg, ink } = changeKindColors[kind];
  return (
    <span className="inline-block rounded-pill px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: bg, color: ink }}>
      {changeKindLabel[kind]}
    </span>
  );
}

function Change({ entry }: { entry: ActivityData }) {
  return (
    <div className="min-w-0 text-sm">
      <div className="font-semibold break-words">{entry.summary}</div>
      {(entry.oldValue || entry.newValue) && (
        <div className="break-words">
          {entry.oldValue && <span className="text-muted line-through">{entry.oldValue}</span>}
          {entry.oldValue && entry.newValue && <span aria-hidden className="mx-1.5 text-muted">→</span>}
          {entry.newValue && <strong>{entry.newValue}</strong>}
        </div>
      )}
    </div>
  );
}

export function HistoryView({
  projectId,
  entries,
  rules,
  notifyInApp,
  notifyEmail,
}: {
  projectId: string;
  entries: ActivityData[];
  rules: AlertRuleData[];
  notifyInApp: boolean;
  notifyEmail: boolean;
}) {
  const [filter, setFilter] = useState<KindFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = filter === "all" ? entries : entries.filter((e) => e.kind === filter);
  const groups = groupAlertRules(rules);

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_340px] min-[1100px]:gap-[22px]">
      <section aria-labelledby="historial-titulo" className="min-w-0 rounded-card border border-line bg-white p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="historial-titulo" className="text-base font-extrabold">
            Historial de cambios
          </h2>
          <div className="flex items-center gap-2">
            <label htmlFor="filtro-tipo" className="text-xs font-medium text-muted">
              Tipo
            </label>
            <select
              id="filtro-tipo"
              value={filter}
              onChange={(e) => setFilter(e.target.value as KindFilter)}
              className={`${fieldClass} !h-9 !w-auto`}
            >
              <option value="all">Todos</option>
              {(Object.keys(changeKindLabel) as ActivityData["kind"][]).map((k) => (
                <option key={k} value={k}>
                  {changeKindLabel[k]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-muted">
            {entries.length === 0 ? "Aún no hay cambios registrados. Aparecerán aquí a medida que trabajes en el proyecto." : "No hay cambios de este tipo."}
          </p>
        ) : (
          <>
            <ul className="md:hidden">
              {visible.map((e) => (
                <li key={e.id} className="flex flex-col gap-2 border-t border-surface py-3 first:border-t-0 first:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <KindPill kind={e.kind} />
                    <span className="text-xs text-muted">{formatDateTime(e.createdAt)}</span>
                  </div>
                  <Change entry={e} />
                  {e.reason && <p className="text-[13px] break-words text-muted">Motivo: {e.reason}</p>}
                </li>
              ))}
            </ul>

            <table className="hidden w-full border-collapse md:table">
              <thead>
                <tr>
                  {["Fecha", "Tipo", "Cambio", "Motivo"].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2 text-left text-[11px] font-bold tracking-[.06em] text-muted uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e.id} className="border-t border-surface align-top">
                    <td className="px-3 py-3 text-[13px] whitespace-nowrap text-muted">{formatDateTime(e.createdAt)}</td>
                    <td className="px-3 py-3">
                      <KindPill kind={e.kind} />
                    </td>
                    <td className="px-3 py-3">
                      <Change entry={e} />
                    </td>
                    <td className="px-3 py-3 text-[13px] break-words text-muted">{e.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <aside aria-label="Alertas" className="flex min-w-0 flex-col gap-4">
        <section aria-labelledby="reglas-titulo" className="rounded-card border border-line bg-white p-4 sm:p-5">
          <h2 id="reglas-titulo" className="mb-1 text-base font-extrabold">
            Reglas de alerta
          </h2>
          <p className="mb-3 text-[13px] text-muted">Se revisan cada día a las 7:00 (hora de Bogotá).</p>
          {groups.length === 0 ? (
            <p className="text-sm text-muted">Este proyecto no tiene reglas de alerta.</p>
          ) : (
            <ul>
              {groups.map((g) => (
                <li key={g.kind} className="flex items-center justify-between gap-3 border-t border-surface py-3 first:border-t-0 first:pt-0">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{g.label}</div>
                    <div className="text-xs text-muted">{g.description}</div>
                  </div>
                  <Switch
                    checked={g.enabled}
                    disabled={pending}
                    label={`${g.label}: ${g.enabled ? "activada" : "desactivada"}`}
                    onChange={(enabled) => run(() => setAlertRule({ projectId, kind: g.kind as AlertKind, enabled }))}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="canales-titulo" className="rounded-card border border-line bg-white p-4 sm:p-5">
          <h2 id="canales-titulo" className="mb-3 text-base font-extrabold">
            Dónde recibirlas
          </h2>
          <ul>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm font-semibold">Dentro de la app</span>
              <Switch
                checked={notifyInApp}
                disabled={pending}
                label={`Dentro de la app: ${notifyInApp ? "activado" : "desactivado"}`}
                onChange={(enabled) => run(() => setNotificationChannel({ channel: "in_app", enabled }))}
              />
            </li>
            <li className="flex items-center justify-between gap-3 border-t border-surface py-2.5">
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Correo</span>
                <span className="block text-xs text-muted">El envío se activa al conectar el servicio de correo.</span>
              </span>
              <Switch
                checked={notifyEmail}
                disabled={pending}
                label={`Correo: ${notifyEmail ? "activado" : "desactivado"}`}
                onChange={(enabled) => run(() => setNotificationChannel({ channel: "email", enabled }))}
              />
            </li>
            <li className="flex items-center justify-between gap-3 border-t border-surface py-2.5">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-muted">Microsoft Teams</span>
                <span className="block text-xs text-muted">Próximamente</span>
              </span>
              <Switch checked={false} disabled label="Microsoft Teams: próximamente" onChange={() => {}} />
            </li>
          </ul>
        </section>

        {error && (
          <p role="alert" className="rounded-button bg-[#FDECEA] px-3.5 py-2.5 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <span className={`${labelClass} sr-only`}>Las reglas y los canales se guardan al cambiarlos.</span>
      </aside>
    </div>
  );
}
