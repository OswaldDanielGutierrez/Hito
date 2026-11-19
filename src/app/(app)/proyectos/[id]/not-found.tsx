import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export default function ProjectNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[1376px] flex-col items-start gap-3 px-8 py-7">
      <h1 className="text-2xl font-extrabold">No encontramos este proyecto</h1>
      <p className="text-sm text-muted">Puede que haya sido archivado, eliminado o que el enlace sea incorrecto.</p>
      <Link href="/" className={buttonClass("primary")}>
        Volver a Proyectos
      </Link>
    </main>
  );
}
