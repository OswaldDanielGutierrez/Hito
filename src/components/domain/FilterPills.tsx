import Link from "next/link";
import type { StatusFilter } from "@/lib/domain/portfolio";

export const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "development", label: "Desarrollo" },
  { value: "qa", label: "QA" },
  { value: "production", label: "Prod" },
  { value: "on_hold", label: "En espera" },
  { value: "delivered", label: "Entregados" },
];

/** Dirección de Inicio con los filtros de estado y etiqueta. */
export function homeHref(estado: StatusFilter, tagId?: string) {
  const params = new URLSearchParams();
  if (estado !== "all") params.set("estado", estado);
  if (tagId) params.set("etiqueta", tagId);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function FilterPills({
  active,
  counts,
  tagId,
}: {
  active: StatusFilter;
  counts: Record<StatusFilter, number>;
  tagId?: string;
}) {
  return (
    <nav aria-label="Filtrar proyectos por estado" className="flex flex-wrap gap-2">
      {FILTERS.map(({ value, label }) => {
        const isActive = value === active;
        return (
          <Link
            key={value}
            href={homeHref(value, tagId)}
            aria-current={isActive ? "true" : undefined}
            className={`tap rounded-pill border px-3.5 py-[7px] text-[13px] font-semibold transition-colors duration-[120ms] ease-out ${
              isActive
                ? "border-green-900 bg-green-900 text-white"
                : "border-line bg-white text-ink hover:border-input-border"
            }`}
          >
            {label} <span className="opacity-75">{counts[value]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
