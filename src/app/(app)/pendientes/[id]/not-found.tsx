import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export default function QuickTaskNotFound() {
  return (
    <main id="contenido" className="mx-auto flex w-full max-w-[1376px] flex-col items-start gap-3 px-4 py-7 sm:px-8">
      <h1 className="text-2xl font-extrabold">No encontramos este pendiente</h1>
      <p className="text-sm text-muted">Puede que lo hayas eliminado o que el enlace sea incorrecto.</p>
      <Link href="/pendientes" className={buttonClass("primary")}>
        Volver a Pendientes
      </Link>
    </main>
  );
}
