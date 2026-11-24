import Link from "next/link";
import { homeHref } from "@/components/domain/FilterPills";
import type { StatusFilter } from "@/lib/domain/portfolio";
import { TAG_STYLES, type TagWithUsage } from "@/lib/domain/tags";

/** Filtro de Inicio por etiqueta. Elegir la etiqueta activa de nuevo quita el filtro. */
export function TagFilter({ tags, activeId, estado }: { tags: TagWithUsage[]; activeId?: string; estado: StatusFilter }) {
  const usable = tags.filter((t) => t.projects > 0 || t.id === activeId);
  if (usable.length === 0) return null;

  return (
    <nav aria-label="Filtrar proyectos por etiqueta" className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-semibold text-muted">Etiquetas</span>
      {usable.map((t) => {
        const active = t.id === activeId;
        return (
          <Link
            key={t.id}
            href={homeHref(estado, active ? undefined : t.id)}
            aria-current={active ? "true" : undefined}
            className={`tap inline-flex items-center gap-1.5 rounded-pill border px-3 py-[5px] text-[13px] font-semibold transition-colors duration-[120ms] ease-out ${
              active ? "border-green-900 bg-green-900 text-white" : "border-line bg-white text-ink hover:border-input-border"
            }`}
          >
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: TAG_STYLES[t.color].dot }} />
            {t.name} <span className="opacity-75">{t.projects}</span>
          </Link>
        );
      })}
    </nav>
  );
}
