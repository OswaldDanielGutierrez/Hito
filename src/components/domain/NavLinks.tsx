"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const soon = "hidden cursor-not-allowed text-sm font-medium text-green-200 opacity-60 md:inline";

export function NavLinks() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Proyectos", active: pathname === "/" || pathname.startsWith("/proyectos") },
    { href: "/tareas", label: "Mis tareas", active: pathname.startsWith("/tareas") },
  ];

  return (
    <nav aria-label="Principal" className="flex h-full items-center gap-4 md:gap-6">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={`flex h-full items-center border-b-2 text-sm transition-colors duration-[120ms] ease-out ${
            item.active
              ? "border-green-300 font-semibold text-white"
              : "border-transparent font-medium text-green-200 hover:text-white"
          }`}
        >
          {item.label}
        </Link>
      ))}
      <span aria-disabled="true" title="Próximamente" className={soon}>
        Calendario
      </span>
    </nav>
  );
}
