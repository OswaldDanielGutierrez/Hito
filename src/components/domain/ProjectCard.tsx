import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Link as LinkIcon, Workflow } from "lucide-react";
import Link from "next/link";
import { Bar } from "@/components/ui/Bar";
import { Chip } from "@/components/ui/Chip";
import { PhaseSegments } from "@/components/ui/PhaseSegments";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { TagChips } from "@/components/domain/tags/TagChip";
import type { ProjectCardData } from "@/lib/domain/portfolio";
import type { Tag } from "@/lib/domain/tags";

const icon = { size: 13, strokeWidth: 1.9, "aria-hidden": true } as const;

export function ProjectCard({ project: p, tags = [] }: { project: ProjectCardData; tags?: Tag[] }) {
  const updated = formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true, locale: es });

  return (
    <Link
      href={`/proyectos/${p.id}`}
      className="flex flex-col gap-3.5 rounded-card border border-line bg-white px-4 py-4 sm:px-5 sm:py-[18px] transition-[border-color,box-shadow] duration-[120ms] ease-out hover:border-input-border hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {p.area && <div className="text-xs font-semibold text-muted">{p.area}</div>}
          <h2 className="text-base leading-[22px] font-extrabold break-words sm:text-[17px]">{p.name}</h2>
        </div>
        <StatusLabel status={p.status} />
      </div>

      <TagChips tags={tags} className="-mt-1" />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="font-bold">
            {p.status === "delivered" ? "Fases completadas" : `Fase actual: ${p.currentName ?? "—"}`}
          </span>
          {p.phasesTotal > 0 && (
            <span className="text-muted">
              {p.status === "delivered" ? `${p.phasesTotal} de ${p.phasesTotal}` : `Fase ${p.currentIndex} de ${p.phasesTotal}`}
            </span>
          )}
        </div>
        <PhaseSegments segments={p.segments} health={p.health} currentName={p.currentName} />
        <div className="text-xs font-semibold" style={{ color: p.phaseLine.color }}>
          {p.phaseLine.text}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-surface pt-3.5">
        <div>
          <div className="mb-1.5 text-xs font-medium text-muted">Tareas</div>
          <div className="flex items-center gap-2">
            <Bar percent={p.tasks.percent} label={`Avance de tareas de ${p.name}`} />
            <span className="text-xs font-bold">
              {p.tasks.done}/{p.tasks.total}
            </span>
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-xs font-medium text-muted">Entrega final</div>
          <div className="text-[13px] font-semibold" style={{ color: p.finalLine.color }}>
            {p.finalLine.text}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip label="Documentos" icon={<FileText {...icon} />}>
          {p.resources.documents}
        </Chip>
        <Chip label="Flujos y código" icon={<Workflow {...icon} />}>
          {p.resources.flowsCode}
        </Chip>
        <Chip label="Enlaces" icon={<LinkIcon {...icon} />}>
          {p.resources.links}
        </Chip>
        <span className="ml-auto text-xs text-muted">Actualizado {updated}</span>
      </div>
    </Link>
  );
}
