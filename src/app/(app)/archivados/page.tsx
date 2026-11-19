import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { RestoreButton } from "@/components/domain/RestoreButton";
import { formatDate, todayInBogota } from "@/lib/domain/dates";
import { createClient } from "@/lib/supabase/server";

export default function ArchivedPage() {
  return (
    <Suspense
      fallback={
        <main id="contenido" aria-busy="true" aria-label="Cargando archivados" className="mx-auto w-full max-w-[1376px] px-4 py-5 sm:px-8 sm:py-7">
          <div className="h-9 w-56 animate-pulse rounded-card bg-surface" />
        </main>
      }
    >
      <ArchivedContent />
    </Suspense>
  );
}

async function ArchivedContent() {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, area, archived_at")
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (
    <main id="contenido" className="mx-auto flex w-full max-w-[1376px] flex-col gap-5 px-4 py-5 sm:gap-[22px] sm:px-8 sm:py-7">
      <div>
        <Link href="/" className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-green-700 hover:underline">
          <ArrowLeft size={16} strokeWidth={1.9} aria-hidden />
          Volver a Proyectos
        </Link>
        <h1 className="text-2xl leading-8 font-extrabold tracking-[-0.02em] sm:text-[30px] sm:leading-[38px]">Proyectos archivados</h1>
        <p className="mt-1 text-sm text-muted">No aparecen en Inicio. Restáuralos para volver a verlos allí.</p>
      </div>

      {(data ?? []).length === 0 ? (
        <p className="rounded-card border border-line bg-white p-5 text-sm text-muted">No tienes proyectos archivados.</p>
      ) : (
        <ul className="overflow-hidden rounded-card border border-line bg-white">
          {(data ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-surface px-4 py-3 first:border-t-0 sm:px-5">
              <div className="min-w-0">
                <Link href={`/proyectos/${p.id}`} className="text-sm font-bold break-words hover:underline">
                  {p.name}
                </Link>
                <div className="text-xs text-muted">
                  {p.area ? `${p.area} · ` : ""}Archivado el {formatDate(todayInBogota(new Date(p.archived_at!)))}
                </div>
              </div>
              <RestoreButton projectId={p.id} name={p.name} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
