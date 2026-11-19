"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Code, FileText, Link as LinkIcon, MoreHorizontal, Pencil, Pin, PinOff, Trash2, Workflow } from "lucide-react";
import type { ResourceData } from "@/lib/data/project";
import { formatDate, todayInBogota } from "@/lib/domain/dates";
import type { ResourceKind } from "@/lib/domain/types";
import { resourceKindLabel } from "@/lib/labels";
import { resourceKindColors } from "@/lib/ui-colors";

const kindIcon: Record<ResourceKind, typeof FileText> = {
  document: FileText,
  flow: Workflow,
  code: Code,
  link: LinkIcon,
};

const item =
  "flex cursor-pointer items-center gap-2 rounded-input px-3 py-2.5 text-base outline-none data-[highlighted]:bg-surface sm:py-2 sm:text-sm";

export function ResourceCard({
  resource,
  projectId,
  phaseName,
  onEdit,
  onTogglePin,
  onDelete,
}: {
  resource: ResourceData;
  projectId: string;
  phaseName: string | null;
  onEdit: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const Icon = kindIcon[resource.kind];
  const { bg, ink } = resourceKindColors[resource.kind];
  const href = resource.storagePath ? `/proyectos/${projectId}/recursos/${resource.id}/archivo` : (resource.url ?? "#");

  return (
    <li className="relative flex flex-col gap-3 rounded-card border border-line bg-white p-4 transition-[border-color,box-shadow] duration-[120ms] ease-out hover:border-input-border hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-[42px] shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: bg, color: ink }}
        >
          <Icon size={20} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold" style={{ color: ink }}>
            {resourceKindLabel[resource.kind]}
          </div>
          <div className="truncate text-xs text-muted">{resource.source ?? "Archivo"}</div>
        </div>
        {resource.pinned && <Pin size={16} strokeWidth={1.9} aria-label="Fijado" className="mt-1 shrink-0 text-green-700" />}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            aria-label={`Opciones de ${resource.name}`}
            className="relative z-10 -mt-1 -mr-1 flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink sm:size-9"
          >
            <MoreHorizontal size={18} strokeWidth={1.9} aria-hidden />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-50 min-w-[190px] rounded-card border border-line bg-white p-1.5 shadow-card-hover"
            >
              <DropdownMenu.Item className={item} onSelect={onEdit}>
                <Pencil size={16} strokeWidth={1.9} aria-hidden />
                Editar
              </DropdownMenu.Item>
              <DropdownMenu.Item className={item} onSelect={onTogglePin}>
                {resource.pinned ? <PinOff size={16} strokeWidth={1.9} aria-hidden /> : <Pin size={16} strokeWidth={1.9} aria-hidden />}
                {resource.pinned ? "Quitar de fijados" : "Fijar en el Resumen"}
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-line" />
              <DropdownMenu.Item className={`${item} text-danger`} onSelect={onDelete}>
                <Trash2 size={16} strokeWidth={1.9} aria-hidden />
                Eliminar
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${resource.name} (abre en una pestaña nueva)`}
        className="text-[15px] leading-5 font-bold break-words after:absolute after:inset-0 after:content-[''] hover:underline"
      >
        {resource.name}
      </a>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-surface pt-3">
        {phaseName ? (
          <span className="max-w-[60%] truncate rounded-pill bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
            {phaseName}
          </span>
        ) : (
          <span className="text-[11px] text-muted">Sin fase</span>
        )}
        <span className="text-xs text-muted">{formatDate(todayInBogota(new Date(resource.createdAt)))}</span>
      </div>
    </li>
  );
}
