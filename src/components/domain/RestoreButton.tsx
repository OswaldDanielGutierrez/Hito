"use client";

import { useTransition } from "react";
import { restoreProject } from "@/app/(app)/proyectos/actions";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";

export function RestoreButton({ projectId, name }: { projectId: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      aria-label={`Restaurar ${name}`}
      onClick={() =>
        startTransition(async () => {
          const result = await restoreProject({ projectId });
          if (result.ok) toast("Proyecto restaurado");
          else toast(result.error, "error");
        })
      }
    >
      {pending ? "Restaurando…" : "Restaurar"}
    </Button>
  );
}
