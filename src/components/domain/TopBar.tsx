import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/config/app";
import { AvatarMenu } from "./AvatarMenu";
import { NavLinks } from "./NavLinks";

export function TopBarSkeleton() {
  return (
    <header className="bg-green-900">
      <div className="mx-auto flex h-[var(--top-bar-height)] max-w-[1376px] items-center px-4 sm:px-8">
        <span aria-hidden className="mr-2 inline-block size-4 rotate-45 rounded-[3px] bg-green-500" />
        <span className="text-base font-extrabold text-white">{APP_NAME}</span>
      </div>
    </header>
  );
}

export function TopBar({ initials, email }: { initials: string; email: string }) {
  return (
    <header className="bg-green-900">
      <div className="mx-auto flex h-[var(--top-bar-height)] max-w-[1376px] items-center gap-4 px-4 sm:px-8 md:gap-6">
        <Link href="/" className="mr-2 flex items-center gap-2">
          <span aria-hidden className="inline-block size-4 rotate-45 rounded-[3px] bg-green-500" />
          <span className="text-base font-extrabold text-white">{APP_NAME}</span>
        </Link>

        <NavLinks />

        <div className="ml-auto flex items-center gap-3 md:gap-4">
          <label className="relative hidden lg:block">
            <span className="sr-only">Buscar proyectos, tareas o recursos</span>
            <Search size={16} strokeWidth={1.9} aria-hidden className="absolute top-1/2 left-3 -translate-y-1/2 text-green-200" />
            <input
              type="search"
              disabled
              title="Próximamente"
              placeholder="Buscar proyectos, tareas o recursos"
              className="h-9 w-[280px] cursor-not-allowed rounded-input bg-green-800 pr-3 pl-9 text-sm text-white placeholder:text-green-200 xl:w-[300px]"
            />
          </label>
          <button
            type="button"
            disabled
            aria-label="Notificaciones (próximamente)"
            className="hidden size-9 cursor-not-allowed items-center justify-center rounded-full text-green-200 opacity-60 sm:flex"
          >
            <Bell size={18} strokeWidth={1.9} aria-hidden />
          </button>
          <AvatarMenu initials={initials} email={email} />
        </div>
      </div>
    </header>
  );
}
