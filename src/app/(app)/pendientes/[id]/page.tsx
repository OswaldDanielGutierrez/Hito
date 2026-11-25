import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { NotepadEditor } from "@/components/domain/notes/NotepadEditor";
import { TaskAttachments } from "@/components/domain/pendientes/TaskAttachments";
import { TaskHeaderControls } from "@/components/domain/pendientes/TaskHeaderControls";
import { TaskNotes } from "@/components/domain/pendientes/TaskNotes";
import { loadQuickTaskPage } from "@/lib/data/pendientes";
import { formatDateTime, todayInBogota } from "@/lib/domain/dates";
import { dueLabel } from "@/lib/domain/pendientes";

export default function QuickTaskPage({ params }: PageProps<"/pendientes/[id]">) {
  return (
    <Suspense fallback={<QuickTaskSkeleton />}>
      <QuickTaskContent params={params} />
    </Suspense>
  );
}

function QuickTaskSkeleton() {
  const block = "animate-pulse rounded-card bg-surface";
  return (
    <main id="contenido" aria-busy="true" aria-label="Cargando pendiente" className="mx-auto flex w-full max-w-[1376px] flex-col gap-5 px-4 py-5 sm:px-8 sm:py-6">
      <div className={`${block} h-4 w-48`} />
      <div className={`${block} h-24`} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <div className={`${block} h-[60dvh]`} />
        <div className="flex flex-col gap-4">
          <div className={`${block} h-48`} />
          <div className={`${block} h-48`} />
        </div>
      </div>
    </main>
  );
}

async function QuickTaskContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const data = await loadQuickTaskPage(id);
  if (!data) notFound();

  const { task, notes, attachments, tags, userId } = data;
  const due = dueLabel(task, todayInBogota());

  return (
    <main id="contenido" className="mx-auto flex w-full max-w-[1376px] flex-col gap-5 px-4 py-5 sm:px-8 sm:py-6">
      <header className="rounded-card border border-line bg-white p-4 sm:p-5">
        <nav aria-label="Ruta" className="mb-2 text-[13px] text-muted">
          <Link href="/pendientes" className="tap hover:text-ink hover:underline">
            Pendientes
          </Link>{" "}
          / <span aria-current="page">{task.title}</span>
        </nav>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="min-w-0">
            <h1 className={`text-xl leading-[26px] font-extrabold tracking-[-0.015em] break-words sm:text-2xl sm:leading-[30px] ${task.done ? "text-muted line-through" : ""}`}>
              {task.title}
            </h1>
            {task.done && <p className="mt-1 text-[13px] font-semibold text-green-700-hover">Hecho</p>}
          </div>
          <TaskHeaderControls key={task.id + String(task.done)} id={task.id} done={task.done} tags={tags} tagIds={task.tagIds} />
        </div>

        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          <Datum label="Proyecto">{task.projectName ?? "Sin proyecto"}</Datum>
          <Datum label="Pidió">{task.requestedBy}</Datum>
          <Datum label="Fecha límite">
            <span className="rounded-label px-2 py-[3px] text-xs font-bold whitespace-nowrap" style={{ backgroundColor: due.bg, color: due.ink }}>
              {due.text}
            </span>
          </Datum>
          {task.priority === "high" && !task.done && <Datum label="Prioridad">Alta</Datum>}
          <Datum label="Creado">{formatDateTime(task.createdAt)}</Datum>
        </dl>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <NotepadEditor key={task.id} kind="quick" id={task.id} initial={task.notepad} />
        <aside aria-label="Adjuntos y notas importantes" className="flex min-w-0 flex-col gap-4">
          <TaskAttachments quickTaskId={task.id} userId={userId} attachments={attachments} />
          <TaskNotes quickTaskId={task.id} notes={notes} />
        </aside>
      </div>
    </main>
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
