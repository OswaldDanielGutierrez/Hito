"use client";

import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-[1376px] flex-col items-start gap-3 px-8 py-7">
      <p role="alert" className="text-sm font-medium text-danger">
        No se pudieron cargar los datos. Revisa tu conexión e inténtalo de nuevo.
      </p>
      <Button variant="secondary" onClick={reset}>
        Reintentar
      </Button>
    </main>
  );
}
