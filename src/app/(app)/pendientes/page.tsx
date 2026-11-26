import { connection } from "next/server";
import { Suspense } from "react";
import { PendientesBoard } from "@/components/domain/pendientes/PendientesBoard";
import { loadPendientes } from "@/lib/data/pendientes";
import { formatLongDate, todayInBogota } from "@/lib/domain/dates";

export default function PendientesPage() {
  return (
    <Suspense fallback={<PendientesSkeleton />}>
      <PendientesContent />
    </Suspense>
  );
}

function PendientesSkeleton() {
  const block = "animate-pulse rounded-card bg-surface";
  return (
    <main id="contenido" aria-busy="true" aria-label="Cargando pendientes" className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-8 sm:py-7">
      <div className="flex flex-col gap-2">
        <div className={`${block} h-4 w-40`} />
        <div className={`${block} h-9 w-56`} />
      </div>
      <div className="flex flex-col gap-[18px]">
        <div className={`${block} h-[120px]`} />
        <div className={`${block} h-9 w-[420px] max-w-full`} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${block} h-[124px]`} />
          ))}
        </div>
      </div>
    </main>
  );
}

async function PendientesContent() {
  await connection();
  const now = new Date();
  const today = todayInBogota(now);
  const data = await loadPendientes();

  return (
    <PendientesBoard
      today={today}
      longDate={formatLongDate(now)}
      tasks={data.tasks}
      projects={data.projects}
      requesters={data.requesters}
      ownerName={data.ownerName}
      tags={data.tags}
    />
  );
}
