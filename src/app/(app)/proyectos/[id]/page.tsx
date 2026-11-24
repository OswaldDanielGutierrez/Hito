import { ExternalLink, FileText, Link as LinkIcon, Workflow, Code } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ProjectBodySkeleton } from "@/components/domain/project/BodySkeleton";
import { Bar } from "@/components/ui/Bar";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { TaskStateBadge } from "@/components/ui/TaskStateBadge";
import { getAlertRules, getProjectData } from "@/lib/data/project";
import { upcomingAlerts } from "@/lib/domain/alerts";
import { daysUntil, formatDate, formatDayMonth, timeInBogota, todayInBogota } from "@/lib/domain/dates";
import { phaseNote } from "@/lib/domain/phaseNote";
import { currentPhase, phaseProgress } from "@/lib/domain/progress";
import { scheduleNotice } from "@/lib/domain/scheduleNotice";
import type { ResourceKind } from "@/lib/domain/types";
import { resourceKindColors } from "@/lib/ui-colors";

const kindIcon: Record<ResourceKind, typeof FileText> = {
  document: FileText,
  flow: Workflow,
  code: Code,
  link: LinkIcon,
};

const card = "rounded-card border border-line bg-white";

export default function ProjectSummary({ params }: PageProps<"/proyectos/[id]">) {
  return (
    <Suspense fallback={<ProjectBodySkeleton />}>
      <SummaryContent params={params} />
    </Suspense>
  );
}

async function SummaryContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const [data, rules] = await Promise.all([getProjectData(id), getAlertRules(id)]);
  if (!data) notFound();

  const { project, phases, tasks, resources } = data;
  const now = new Date();
  const today = todayInBogota(now);
  const current = currentPhase(phases);
  const currentTasks = current ? tasks.filter((t) => t.phaseId === current.id && !t.parentTaskId) : [];
  const notice = scheduleNotice(phases.map((p) => ({ ...p, estimatedDate: p.estimatedDate })));
  const pinned = resources.filter((r) => r.pinned);
  const alerts = upcomingAlerts(
    {
      phases,
      tasks: tasks.map((t) => ({ title: t.title, state: t.state, dueDate: t.dueDate, parentTaskId: t.parentTaskId })),
      deliverySettled: project.status === "delivered",
      rules: rules.length > 0 ? rules : undefined,
    },
    today,
    timeInBogota(now),
  );

  return (
    <main id="contenido" className="mx-auto flex w-full max-w-[1376px] flex-col gap-5 px-4 py-5 sm:gap-[22px] sm:px-8 sm:py-6">
      <section aria-labelledby="fases-titulo">
        <div className="mb-3.5 flex items-baseline justify-between">
          <h2 id="fases-titulo" className="text-lg font-extrabold">
            Fases y entregas estimadas
          </h2>
          <Link href={`/proyectos/${project.id}/fases`} className="tap text-[13px] font-bold text-green-700 hover:underline">
            Ver fases y tareas
          </Link>
        </div>

        {phases.length === 0 ? (
          <p className={`${card} min-w-0 p-4 sm:p-5 text-sm text-muted`}>Este proyecto aún no tiene fases.</p>
        ) : (
          <ol tabIndex={0} aria-label="Fases del proyecto" className="-mx-4 grid auto-cols-[minmax(200px,1fr)] scroll-px-4 snap-x snap-mandatory grid-flow-col gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:auto-cols-[minmax(180px,1fr)] sm:gap-3.5 sm:px-0">
            {phases.map((phase, i) => {
              const isCurrent = phase.id === current?.id;
              const isDone = phase.status === "completed";
              const note = phaseNote({ ...phase, status: isCurrent ? "in_progress" : phase.status });
              const progress = phaseProgress(tasks, phase.id);
              const circle = isDone
                ? "bg-green-700 text-white"
                : isCurrent
                  ? "bg-[#D9822B] text-ink"
                  : "bg-surface text-muted";

              return (
                <li
                  key={phase.id}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex snap-start flex-col gap-2 rounded-card px-4 py-3.5 ${
                    isCurrent ? "border-2 border-[#D9822B] bg-[#FFFAF4]" : "border border-line bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${circle}`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-extrabold">{phase.name}</span>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted">Entrega estimada</div>
                    <div className="text-lg font-extrabold">{phase.estimatedDate ? formatDate(phase.estimatedDate) : "—"}</div>
                  </div>
                  <div className="text-xs font-semibold" style={{ color: note.color }}>
                    {note.text}
                  </div>
                  <div className="mt-auto flex items-center gap-2">
                    <Bar percent={progress.percent} label={`Avance de la fase ${phase.name}`} />
                    <span className="text-xs font-bold">
                      {progress.done}/{progress.total}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="grid grid-cols-1 gap-[22px] min-[1100px]:grid-cols-[minmax(600px,1fr)_minmax(360px,0.5fr)]">
        <section aria-labelledby="tareas-titulo" className={`${card} min-w-0 p-4 sm:p-5`}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 id="tareas-titulo" className="text-base font-extrabold">
              Tareas de la fase actual
            </h2>
            <StatusLabel status={project.status} />
            {current?.estimatedDate && (
              <span className="text-xs text-muted">estimada al {formatDayMonth(current.estimatedDate)}</span>
            )}
            <Link href={`/proyectos/${project.id}/fases`} className="tap ml-auto text-[13px] font-bold text-green-700 hover:underline">
              Ver todas
            </Link>
          </div>

          {!current ? (
            <p className="border-t border-surface pt-4 text-sm text-muted">Todas las fases están completadas.</p>
          ) : currentTasks.length === 0 ? (
            <p className="border-t border-surface pt-4 text-sm text-muted">
              Esta fase no tiene tareas.{" "}
              <Link href={`/proyectos/${project.id}/fases`} className="font-bold text-green-700 hover:underline">
                Agrega la primera.
              </Link>
            </p>
          ) : (
            <ul>
              {currentTasks.map((t) => {
                const days = t.dueDate ? daysUntil(t.dueDate, today) : null;
                const urgent = t.state !== "done" && days !== null && days >= 0 && days <= 1;
                return (
                  <li
                    key={t.id}
                    className="grid grid-cols-[92px_1fr] items-center gap-x-3 gap-y-1 border-t border-surface py-3 sm:grid-cols-[92px_1fr_auto_84px]"
                  >
                    <TaskStateBadge state={t.state} />
                    <span className="min-w-0 text-sm font-semibold break-words sm:truncate">{t.title}</span>
                    <div className="col-start-2 flex gap-3 text-xs text-muted sm:contents">
                      <span>{t.estimatedHours !== null ? `${t.estimatedHours} h` : ""}</span>
                      <span className={`sm:w-[84px] sm:text-right ${urgent ? "font-bold text-warn" : ""}`}>
                        {t.dueDate ? formatDate(t.dueDate) : "—"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {notice && (
            <p role="note" className="mt-3 rounded-button bg-[#FDF0E3] px-3.5 py-2.5 text-[13px] font-semibold text-warn">
              {notice}
            </p>
          )}
        </section>

        <div className="flex flex-col gap-[22px]">
          <section aria-labelledby="fijados-titulo" className={`${card} min-w-0 p-4 sm:p-5`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="fijados-titulo" className="text-base font-extrabold">
                Recursos fijados
              </h2>
              {resources.length > 0 && (
                <Link href={`/proyectos/${project.id}/recursos`} className="tap text-[13px] font-bold text-green-700 hover:underline">
                  Ver los {resources.length}
                </Link>
              )}
            </div>
            {pinned.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay recursos fijados.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {pinned.slice(0, 4).map((r) => {
                  const Icon = kindIcon[r.kind];
                  const { bg, ink } = resourceKindColors[r.kind];
                  const body = (
                    <>
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-input"
                        style={{ backgroundColor: bg, color: ink }}
                      >
                        <Icon size={18} strokeWidth={1.9} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{r.name}</span>
                        <span className="block text-xs text-muted">{r.source ?? "Archivo"}</span>
                      </span>
                      {r.url && <ExternalLink size={16} strokeWidth={1.9} aria-hidden className="text-muted" />}
                    </>
                  );
                  return (
                    <li key={r.id}>
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${r.name} (abre en una pestaña nueva)`}
                          className="flex items-center gap-3 rounded-input hover:bg-page"
                        >
                          {body}
                        </a>
                      ) : (
                        <div className="flex items-center gap-3">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="alertas-titulo" className={`${card} min-w-0 p-4 sm:p-5`}>
            <h2 id="alertas-titulo" className="mb-3 text-base font-extrabold">
              Próximas alertas
            </h2>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted">No hay alertas próximas.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {alerts.map((a) => (
                  <li key={`${a.date}${a.time}${a.text}`} className="flex gap-3 text-sm">
                    <span className="w-[86px] shrink-0 text-xs font-extrabold">
                      {formatDayMonth(a.date)} · {a.time}
                    </span>
                    <span>{a.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
