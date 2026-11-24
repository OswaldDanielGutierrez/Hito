"use client";

import { useState, useTransition } from "react";
import { setProjectTags } from "@/app/(app)/etiquetas/actions";
import { toast } from "@/components/ui/Toaster";
import type { TagWithUsage } from "@/lib/domain/tags";
import { TagPicker } from "../tags/TagPicker";

/** Etiquetas del proyecto: chips y selector. Guarda al instante. */
export function ProjectTags({
  projectId,
  tags,
  initialIds,
}: {
  projectId: string;
  tags: TagWithUsage[];
  initialIds: string[];
}) {
  const [ids, setIds] = useState(initialIds);
  const [, startTransition] = useTransition();

  function change(next: string[]) {
    const previous = ids;
    setIds(next);
    startTransition(async () => {
      const result = await setProjectTags({ projectId, tagIds: next });
      if (!result.ok) {
        setIds(previous);
        toast(result.error, "error");
      }
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <TagPicker id="proyecto-etiquetas" tags={tags} selectedIds={ids} onChange={change} />
    </div>
  );
}
