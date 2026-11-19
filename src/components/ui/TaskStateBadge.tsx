import type { TaskState } from "@/lib/domain/types";
import { taskStateLabel } from "@/lib/labels";
import { taskStateColors } from "@/lib/ui-colors";

export function TaskStateBadge({ state }: { state: TaskState }) {
  const { bg, ink } = taskStateColors[state];
  return (
    <span
      className="inline-flex h-7 w-[92px] items-center justify-center rounded-label text-xs font-bold"
      style={{ backgroundColor: bg, color: ink }}
    >
      {taskStateLabel[state]}
    </span>
  );
}
