import { LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";
import { APP_NAME } from "@/config/app";

export default function Home() {
  return (
    <>
      <header className="flex h-[var(--top-bar-height)] items-center justify-between bg-green-900 px-8">
        <div className="flex items-center">
          <span aria-hidden className="mr-2 inline-block size-4 rotate-45 rounded-[3px] bg-green-500" />
          <span className="text-base font-extrabold text-white">{APP_NAME}</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 text-sm font-medium text-green-200 hover:text-white"
          >
            <LogOut size={18} strokeWidth={1.9} aria-hidden />
            Salir
          </button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-[1376px] px-8 py-7">
        <h1 className="text-3xl font-extrabold tracking-tight">Buenos días</h1>
        <p className="mt-2 text-sm text-muted">Aún no tienes proyectos. Registra el primero.</p>
      </main>
    </>
  );
}
