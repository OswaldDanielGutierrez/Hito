"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const soon = "hidden cursor-not-allowed text-sm font-medium text-green-200 opacity-60 md:inline";

export function NavLinks() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Proyectos", short: "Proyectos", active: pathname === "/" || pathname.startsWith("/proyectos") },
    { href: "/pendientes", label: "Pendientes", short: "Pendientes", active: pathname.startsWith("/pendientes") },
  ];

  return (
    <nav aria-label="Principal" className="flex h-full items-center gap-4 md:gap-6 max-[379px]:gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          aria-label={item.label}
          className={`flex h-full items-center border-b-2 text-sm whitespace-nowrap max-[379px]:text-[13px] transition-colors duration-[120ms] ease-out ${
            item.active
              ? "border-green-300 font-semibold text-white"
              : "border-transparent font-medium text-green-200 hover:text-white"
          }`}
        >
          <span aria-hidden className="max-[379px]:hidden">
            {item.label}
          </span>
          <span aria-hidden className="hidden max-[379px]:inline">
            {item.short}
          </span>
        </Link>
      ))}
      <span aria-disabled="true" title="Próximamente" className={soon}>
        Calendario
      </span>
    </nav>
  );
}
