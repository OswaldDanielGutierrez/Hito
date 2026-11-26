"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Flag, MoreHorizontal, NotebookPen, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TagChips } from "@/components/domain/tags/TagChip";
import type { Tag } from "@/lib/domain/tags";
import { formatDate, todayInBogota } from "@/lib/domain/dates";
import { detailSummary, dueLabel, NO_PROJECT_COLOR, projectColor, requesterAvatar, type QuickTask } from "@/lib/domain/pendientes";

const menuItem =
  "flex cursor-pointer items-center gap-2 rounded-input px-3 py-2.5 text-base outline-none data-[highlighted]:bg-surface sm:py-2 sm:text-sm";

export function TaskCard({
  task,
  tags,
  today,
  ownerName,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: QuickTask;
  tags: Tag[];
  today: string;
  ownerName: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();

  const due = dueLabel(task, today);
  const avatar = requesterAvatar(task.requestedBy, ownerName);
  const color = task.projectId ? projectColor(task.projectId) : NO_PROJECT_COLOR;
  const overdueOpen = !task.done && task.dueDate !== null && task.dueDate < today;
  const isTemp = task.id.startsWith("temp-");
  const summary = detailSummary(task);
  const created = formatDate(todayInBogota(new Date(task.createdAt)));

  return (
    <article
      aria-label={task.title}
      className={`group relative flex min-h-[124px] overflow-hidden rounded-card border bg-white transition-[border-color,box-shadow] duration-[120ms] ease-out hover:shadow-card-hover has-[.card-link:focus-visible]:outline-2 has-[.card-link:focus-visible]:outline-offset-2 has-[.card-link:focus-visible]:outline-green-700 ${overdueOpen ? "border-[#E8B4AE]" : "border-line hover:border-input-border"}`}
    >
      <span aria-hidden className="w-1.5 shrink-0" style={{ backgroundColor: color }} />

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            role="checkbox"
            aria-checked={task.done}
            aria-label={task.title}
            disabled={isTemp}
            onClick={onToggle}
            className={`relative z-10 mt-px flex size-[22px] shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors duration-[120ms] ease-out after:absolute after:-inset-2 after:content-[''] ${
              task.done ? "border-green-700 bg-green-700 text-white" : "border-input-border bg-white hover:border-green-700"
            }`}
          >
            {task.done && <Check size={14} strokeWidth={3} aria-hidden />}
          </button>

          <div className="min-w-0 flex-1">
            {isTemp ? (
              <span className="block text-[15px] leading-5 font-bold break-words">{task.title}</span>
            ) : (
              <Link
                href={`/pendientes/${task.id}`}
                className={`card-link block text-[15px] leading-5 font-bold break-words after:absolute after:inset-0 after:content-[''] focus-visible:outline-none ${
                  task.done ? "text-muted line-through" : "hover:underline"
                }`}
              >
                {task.title}
              </Link>
            )}
            {task.priority === "high" && !task.done && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-label bg-[#FDECEA] px-1.5 py-0.5 text-[11px] font-extrabold text-danger">
                <Flag size={11} strokeWidth={2.2} aria-hidden />
                Alta
              </span>
            )}
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              aria-label={`Opciones de ${task.title}`}
              disabled={isTemp}
              className="relative z-10 -mt-1 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-muted opacity-100 hover:bg-surface hover:text-ink focus-visible:opacity-100 data-[state=open]:opacity-100 sm:size-8 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
            >
              <MoreHorizontal size={18} strokeWidth={1.9} aria-hidden />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="z-50 min-w-[180px] rounded-card border border-line bg-white p-1.5 shadow-card-hover"
              >
                <DropdownMenu.Item className={menuItem} onSelect={() => router.push(`/pendientes/${task.id}`)}>
                  <NotebookPen size={16} strokeWidth={1.9} aria-hidden />
                  Abrir pendiente
                </DropdownMenu.Item>
                <DropdownMenu.Item className={menuItem} onSelect={onEdit}>
                  <Pencil size={16} strokeWidth={1.9} aria-hidden />
                  Editar detalles
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-line" />
                <DropdownMenu.Item className={`${menuItem} text-danger`} onSelect={onDelete}>
                  <Trash2 size={16} strokeWidth={1.9} aria-hidden />
                  Eliminar
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {task.projectName ? (
          <span className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-label bg-surface px-2.5 py-1 text-xs font-bold">
            <span aria-hidden className="size-[9px] shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="truncate">{task.projectName}</span>
          </span>
        ) : (
          <span className="inline-flex w-fit items-center rounded-label border border-dashed border-gray-500 bg-white px-2.5 py-1 text-xs font-bold text-muted">
            Sin proyecto
          </span>
        )}

        <TagChips tags={tags} />

        <div className="flex flex-col items-start gap-0.5">
          {(isTemp || summary) && (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-green-700">
              <NotebookPen size={14} strokeWidth={1.9} aria-hidden />
              {isTemp ? "Guardando…" : summary}
            </span>
          )}
          <span className="text-[11px] font-semibold text-muted">Creado {created}</span>
        </div>

        <div className="mt-auto flex items-center gap-2.5 border-t border-surface pt-2.5">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
            style={{ backgroundColor: avatar.bg, color: avatar.ink }}
          >
            {avatar.initials}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[11px] font-semibold text-muted">Pidió</span>
            <span className="block truncate text-[13px] font-bold">{task.requestedBy}</span>
          </span>
          <span
            className="shrink-0 rounded-label px-2 py-[3px] text-xs font-bold whitespace-nowrap"
            style={{ backgroundColor: due.bg, color: due.ink }}
          >
            {due.text}
          </span>
        </div>
      </div>
    </article>
  );
}
