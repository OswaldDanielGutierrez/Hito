"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  href: string;
  label: string;
  count?: number;
  enabled: boolean;
}

export function ProjectTabs({ projectId, taskCount, resourceCount }: { projectId: string; taskCount: number; resourceCount: number }) {
  const pathname = usePathname();
  const base = `/proyectos/${projectId}`;

  const tabs: Tab[] = [
    { href: base, label: "Resumen", enabled: true },
    { href: `${base}/fases`, label: "Fases y tareas", count: taskCount, enabled: true },
    { href: `${base}/recursos`, label: "Recursos", count: resourceCount, enabled: true },
    { href: `${base}/notas`, label: "Notas", enabled: true },
    { href: `${base}/historial`, label: "Historial", enabled: true },
  ];

  return (
    <nav aria-label="Secciones del proyecto" className="-mx-4 flex gap-5 overflow-x-auto px-4 whitespace-nowrap [scrollbar-width:none] sm:mx-0 sm:gap-7 sm:px-0">
      {tabs.map((tab) => {
        const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        const content = (
          <>
            {tab.label}
            {tab.count !== undefined && <span className="ml-1.5 text-xs font-semibold text-muted">{tab.count}</span>}
          </>
        );
        if (!tab.enabled) {
          return (
            <span
              key={tab.href}
              aria-disabled="true"
              title="Próximamente"
              className="shrink-0 cursor-not-allowed border-b-2 border-transparent pb-3 text-sm font-medium text-muted opacity-60"
            >
              {content}
            </span>
          );
        }
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`tap shrink-0 border-b-2 pb-3 text-sm transition-colors duration-[120ms] ease-out ${
              active ? "border-green-700 font-bold text-ink" : "border-transparent font-medium text-muted hover:text-ink"
            }`}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
