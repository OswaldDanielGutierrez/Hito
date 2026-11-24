import { Workflow } from "lucide-react";
import Link from "next/link";
import { Bar } from "@/components/ui/Bar";
import { StatusLabel } from "@/components/ui/StatusLabel";
import type { ProjectData } from "@/lib/data/project";
import { daysColor, daysText, daysUntil, formatDate } from "@/lib/domain/dates";
import { currentPhase, finalDeliveryDate, projectProgress } from "@/lib/domain/progress";
import { ArchivedNotice, ProjectActions } from "./ProjectActions";
import { ProjectTabs } from "./ProjectTabs";

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function ProjectHeaderSkeleton() {
  return (
    <div aria-busy="true" className="border-b border-line bg-white px-4 sm:px-8 py-[18px]">
      <div className="mx-auto max-w-[1376px]">
        <div className="mb-3 h-4 w-48 animate-pulse rounded-label bg-surface" />
        <div className="mb-6 h-11 w-96 animate-pulse rounded-card bg-surface" />
        <div className="h-4 w-72 animate-pulse rounded-label bg-surface" />
      </div>
    </div>
  );
}

export function ProjectHeader({ data, today }: { data: ProjectData; today: string }) {
  const { project, phases, tasks, resources } = data;
  const progress = projectProgress(tasks);
  const current = currentPhase(phases);
  const finalDate = finalDeliveryDate(phases);
  const finalDays = finalDate ? daysUntil(finalDate, today) : null;
  const topLevelTasks = tasks.filter((t) => !t.parentTaskId).length;

  return (
    <>
    {project.archivedAt && <ArchivedNotice projectId={project.id} />}
    <section aria-label={`Proyecto ${project.name}`} className="border-b border-line bg-white px-4 sm:px-8 pt-4 sm:pt-[18px]">
      <div className="mx-auto max-w-[1376px]">
        <nav aria-label="Ruta" className="mb-3 text-[13px] text-muted">
          <Link href="/" className="tap hover:text-ink hover:underline">
            Proyectos
          </Link>{" "}
          / <span aria-current="page">{project.name}</span>
        </nav>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3.5 gap-y-2">
            <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <Workflow size={22} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl leading-[26px] font-extrabold tracking-[-0.015em] break-words sm:text-2xl sm:leading-[30px]">{project.name}</h1>
              {project.description && <p className="text-[13px] text-muted sm:truncate">{project.description}</p>}
            </div>
            <StatusLabel status={project.status} />
          </div>
          <div className="flex gap-3 lg:shrink-0">
            <ProjectActions
              project={project}
              pendingPhases={phases.filter((p) => p.status !== "completed").length}
              hasPhases={phases.length > 0}
            />
          </div>
        </div>

        <dl className="mt-4 mb-4 flex flex-wrap gap-x-6 gap-y-3 sm:mt-[18px] sm:mb-[18px] sm:gap-x-9">
          <Datum label="Fase actual">
            {current ? `${current.name} · ${phases.indexOf(current) + 1} de ${phases.length}` : "—"}
          </Datum>
          <Datum label="Fin de fase estimado">{current?.estimatedDate ? formatDate(current.estimatedDate) : "—"}</Datum>
          <Datum label="Entrega final estimada">
            {finalDate && finalDays !== null ? (
              <>
                {formatDate(finalDate)} ·{" "}
                <span style={{ color: daysColor(finalDays) }}>{lowerFirst(daysText(finalDays))}</span>
              </>
            ) : (
              "—"
            )}
          </Datum>
          <Datum label="Responsable">{project.responsible ?? "—"}</Datum>
          <div className="basis-full sm:basis-auto">
            <dt className="text-xs font-medium text-muted">
              Avance · {progress.done} de {topLevelTasks} tareas
            </dt>
            <dd className="mt-1.5 w-full sm:w-[200px]">
              <Bar percent={progress.percent} label={`Avance del proyecto ${project.name}`} />
            </dd>
          </div>
        </dl>

        <ProjectTabs projectId={project.id} taskCount={topLevelTasks} resourceCount={resources.length} />
      </div>
    </section>
    </>
  );
}

function Datum({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold">{children}</dd>
    </div>
  );
}
