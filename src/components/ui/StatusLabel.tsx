import { projectStatusLabel } from "@/lib/labels";
import type { ProjectStatus } from "@/lib/domain/types";

const styles: Record<ProjectStatus, string> = {
  development: "bg-status-development text-white",
  qa: "bg-status-qa text-ink",
  production: "bg-status-production text-green-900",
  delivered: "bg-status-delivered text-white",
  on_hold: "bg-status-on-hold text-white",
};

export function StatusLabel({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-block rounded-label px-2.5 py-1 text-xs font-bold ${styles[status]}`}>
      {projectStatusLabel[status]}
    </span>
  );
}
