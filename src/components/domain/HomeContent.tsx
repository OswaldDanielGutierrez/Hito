import { Calendar, Pin, Plus, StickyNote, Workflow } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { FilterPills } from "@/components/domain/FilterPills";
import { ProjectCard } from "@/components/domain/ProjectCard";
import { StatCard } from "@/components/domain/StatCard";
import { buttonClass } from "@/components/ui/Button";
import { loadPortfolioInput } from "@/lib/data/portfolio";
import { formatLongDate, greeting, todayInBogota } from "@/lib/domain/dates";
import { buildPortfolio, type StatusFilter } from "@/lib/domain/portfolio";
import { createClient } from "@/lib/supabase/server";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const statIcon = { size: 22, strokeWidth: 1.9 } as const;

function firstName(displayName: string | null | undefined, email: string | undefined) {
  const raw = (displayName || email?.split("@")[0] || "").trim().split(/\s+/)[0];
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "";
}

export async function HomeContent({ filter }: { filter: StatusFilter }) {
  await connection();

  const supabase = await createClient();
  const [input, userResult, settingsResult] = await Promise.all([
    loadPortfolioInput(),
    supabase.auth.getUser(),
    supabase.from("user_settings").select("display_name").maybeSingle(),
  ]);

  const now = new Date();
  const { cards, stats, counts } = buildPortfolio(input, todayInBogota(now));
  const visible = filter === "all" ? cards : cards.filter((c) => c.status === filter);
  const name = firstName(settingsResult.data?.display_name, userResult.data.user?.email);

  return (
    <main className="mx-auto flex w-full max-w-[1376px] flex-col gap-[22px] px-4 sm:px-8 py-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{formatLongDate(now)}</p>
          <h1 className="text-2xl leading-[32px] font-extrabold tracking-[-0.02em] sm:text-[30px] sm:leading-[38px]">
            {greeting(now)}
            {name && `, ${name}`}
          </h1>
        </div>
        <Link href="/proyectos/nuevo" className={buttonClass("primary")}>
          <Plus size={18} strokeWidth={1.9} aria-hidden />
          Registrar proyecto
        </Link>
      </div>

      <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Workflow {...statIcon} />}
          iconBg="#E4F5EB"
          iconColor="#007A3D"
          value={stats.activeProjects}
          label={`${plural(stats.activeProjects, "proyecto activo", "proyectos activos")} de ${stats.totalProjects}`}
        />
        <StatCard
          icon={<Calendar {...statIcon} />}
          iconBg="#FDF0E3"
          iconColor="#8A4A0B"
          value={stats.phasesThisWeek}
          label={plural(stats.phasesThisWeek, "fase termina esta semana", "fases terminan esta semana")}
        />
        <StatCard
          icon={<StickyNote {...statIcon} />}
          iconBg="#E6F0FB"
          iconColor="#1D4F91"
          value={stats.openTasks}
          label={plural(stats.openTasks, "tarea abierta", "tareas abiertas")}
        />
        <StatCard
          icon={<Pin {...statIcon} />}
          iconBg="#FDECEA"
          iconColor="#B42318"
          value={stats.latePhases}
          valueColor={stats.latePhases > 0 ? "#B42318" : undefined}
          label={plural(stats.latePhases, "fase atrasada", "fases atrasadas")}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterPills active={filter} counts={counts} />
        <span className="text-[13px] text-muted">Ordenados por entrega más cercana</span>
      </div>

      <section aria-label="Proyectos" className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-[18px] min-[1280px]:grid-cols-3">
        {visible.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
        <Link
          href="/proyectos/nuevo"
          className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-green-200 p-6 text-center transition-colors duration-[120ms] ease-out hover:bg-green-50"
        >
          <span aria-hidden className="flex size-11 items-center justify-center rounded-full bg-green-50 text-green-700">
            <Plus size={22} strokeWidth={1.9} />
          </span>
          <span className="text-sm font-bold text-green-700">Registrar proyecto</span>
          {counts.all === 0 && <span className="text-sm text-muted">Aún no tienes proyectos. Registra el primero.</span>}
          {counts.all > 0 && visible.length === 0 && (
            <span className="text-sm text-muted">No hay proyectos con este estado.</span>
          )}
        </Link>
      </section>
    </main>
  );
}
