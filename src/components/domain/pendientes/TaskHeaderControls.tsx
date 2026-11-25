"use client";

import { Check, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setQuickTaskTags } from "@/app/(app)/etiquetas/actions";
import { toggleQuickTask } from "@/app/(app)/pendientes/actions";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import type { TagWithUsage } from "@/lib/domain/tags";
import { TagPicker } from "../tags/TagPicker";

/** Marcar como hecho y etiquetas del pendiente abierto. */
export function TaskHeaderControls({
  id,
  done,
  tags,
  tagIds,
}: {
  id: string;
  done: boolean;
  tags: TagWithUsage[];
  tagIds: string[];
}) {
  const router = useRouter();
  const [ids, setIds] = useState(tagIds);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await toggleQuickTask({ id, done: !done });
      if (!result.ok) return toast(result.error, "error");
      router.refresh();
    });
  }

  function changeTags(next: string[]) {
    const previous = ids;
    setIds(next);
    startTransition(async () => {
      const result = await setQuickTaskTags({ quickTaskId: id, tagIds: next });
      if (!result.ok) {
        setIds(previous);
        toast(result.error, "error");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant={done ? "secondary" : "primary"} onClick={toggle} disabled={pending}>
        {done ? <RotateCcw size={16} strokeWidth={1.9} aria-hidden /> : <Check size={16} strokeWidth={2.2} aria-hidden />}
        {done ? "Volver a pendiente" : "Marcar como hecho"}
      </Button>
      <TagPicker id="pendiente-pagina-etiquetas" tags={tags} selectedIds={ids} onChange={changeTags} />
    </div>
  );
}
