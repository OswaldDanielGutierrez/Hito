import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { TaskStateBadge } from "@/components/ui/TaskStateBadge";
import { loadMyTasks } from "@/lib/data/myTasks";
import { daysColor, daysText, daysUntil, formatDate, todayInBogota } from "@/lib/domain/dates";
import { groupMyTasks, type TaskGroupKey } from "@/lib/domain/myTasks";
import { priorityLabel } from "@/lib/labels";
import { priorityColors } from "@/lib/ui-colors";

const groupAccent: Record<TaskGroupKey, string> = {
  overdue: "text-danger",
  today: "text-warn",
  week: "text-ink",
  later: "text-ink",
  nodate: "text-muted",
};

export default function MyTasksPage() {
  return (
    <Suspense fallback={<MyTasksSkeleton />}>
      <MyTasksContent />
    </Suspense>
  );
}

function MyTasksSkeleton() {
  return (
    <main id="contenido" aria-busy="true" aria-label="Cargando tareas" className="mx-auto flex w-full max-w-[1376px] flex-col gap-4 px-4 py-5 sm:px-8 sm:py-7">
      <div className="h-9 w-56 animate-pulse rounded-card bg-surface" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-card bg-surface" />
      ))}
    </main>
  );
}

async function MyTasksContent() {
  await connection();
  const today = todayInBogota();
  const tasks = await loadMyTasks();
  const groups = groupMyTasks(tasks, today).filter((g) => g.tasks.length > 0);

  return (
    <main id="contenido" className="mx-auto flex w-full max-w-[1376px] flex-col gap-5 px-4 py-5 sm:gap-[22px] sm:px-8 sm:py-7">
      <div>
        <h1 className="text-2xl leading-8 font-extrabold tracking-[-0.02em] sm:text-[30px] sm:leading-[38px]">Mis tareas</h1>
        <p className="mt-1 text-sm text-muted">
          {tasks.length === 0
            ? "Todas las tareas abiertas de tus proyectos, por urgencia."
            : `${tasks.length} ${tasks.length === 1 ? "tarea abierta" : "tareas abiertas"} en tus proyectos, por urgencia.`}
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-card border border-line bg-white p-5 text-sm text-muted">
          No tienes tareas abiertas. Cuando agregues tareas a un proyecto aparecerán aquí.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.key} aria-labelledby={`grupo-${group.key}`} className="overflow-hidden rounded-card border border-line bg-white">
            <h2 id={`grupo-${group.key}`} className={`flex items-baseline gap-2 px-4 py-3 text-base font-extrabold sm:px-5 ${groupAccent[group.key]}`}>
              {group.label}
              <span className="text-xs font-semibold text-muted">{group.tasks.length}</span>
            </h2>
            <ul>
              {group.tasks.map((t) => {
                const days = t.dueDate ? daysUntil(t.dueDate, today) : null;
                const priority = priorityColors[t.priority];
                return (
                  <li key={t.id} className="border-t border-surface">
                    <Link
                      href={`/proyectos/${t.projectId}/fases`}
                      className="grid grid-cols-[92px_1fr] items-center gap-x-3 gap-y-1.5 px-4 py-3 hover:bg-page sm:px-5 lg:grid-cols-[92px_1fr_auto_auto_130px]"
                    >
                      <TaskStateBadge state={t.state} />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold break-words">{t.title}</span>
                        <span className="block text-xs break-words text-muted">
                          {t.projectName}
                          {t.phaseName ? ` · ${t.phaseName}` : ""}
                        </span>
                      </span>
                      <span className="col-start-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 lg:contents">
                        <span
                          className="inline-block w-fit rounded-pill px-2.5 py-1 text-xs font-semibold"
                          style={{ backgroundColor: priority.bg, color: priority.ink }}
                        >
                          {priorityLabel[t.priority]}
                        </span>
                        <span className="text-xs text-muted lg:text-right">
                          {t.estimatedHours !== null ? `${t.estimatedHours} h` : ""}
                        </span>
                        <span
                          className="text-[13px] font-semibold lg:text-right"
                          style={{ color: days === null ? undefined : daysColor(days) }}
                        >
                          {t.dueDate && days !== null ? `${formatDate(t.dueDate)} · ${daysText(days)}` : "—"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
