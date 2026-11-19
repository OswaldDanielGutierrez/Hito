"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Flag, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { dueLabel, NO_PROJECT_COLOR, projectColor, requesterAvatar, type QuickTask } from "@/lib/domain/pendientes";

const menuItem =
  "flex cursor-pointer items-center gap-2 rounded-input px-3 py-2.5 text-base outline-none data-[highlighted]:bg-surface sm:py-2 sm:text-sm";

export function TaskCard({
  task,
  today,
  ownerName,
  onToggle,
  onRename,
  onEdit,
  onDelete,
}: {
  task: QuickTask;
  today: string;
  ownerName: string;
  onToggle: () => void;
  onRename: (title: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  const due = dueLabel(task, today);
  const avatar = requesterAvatar(task.requestedBy, ownerName);
  const color = task.projectId ? projectColor(task.projectId) : NO_PROJECT_COLOR;
  const overdueOpen = !task.done && task.dueDate !== null && task.dueDate < today;
  const isTemp = task.id.startsWith("temp-");

  function commit() {
    const title = draft.trim();
    setEditing(false);
    if (title && title !== task.title) onRename(title);
    else setDraft(task.title);
  }

  return (
    <article
      aria-label={task.title}
      className={`group relative flex min-h-[132px] overflow-hidden rounded-card border bg-white ${overdueOpen ? "border-[#E8B4AE]" : "border-line"} ${
        task.done ? "opacity-60" : ""
      }`}
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
            className={`relative mt-px flex size-[22px] shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors duration-[120ms] ease-out after:absolute after:-inset-2 after:content-[''] ${
              task.done ? "border-green-700 bg-green-700 text-white" : "border-input-border bg-white hover:border-green-700"
            }`}
          >
            {task.done && <Check size={14} strokeWidth={3} aria-hidden />}
          </button>

          <div className="min-w-0 flex-1">
            {editing ? (
              <>
                <label htmlFor={`titulo-${task.id}`} className="sr-only">
                  Título del pendiente
                </label>
                <input
                  id={`titulo-${task.id}`}
                  autoFocus
                  value={draft}
                  maxLength={200}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commit();
                    }
                    if (e.key === "Escape") {
                      setDraft(task.title);
                      setEditing(false);
                    }
                  }}
                  className="w-full rounded-input border border-green-700 bg-white px-2 py-1 text-base font-bold sm:text-[15px]"
                />
              </>
            ) : (
              <button
                type="button"
                disabled={isTemp}
                onClick={() => {
                  setDraft(task.title);
                  setEditing(true);
                }}
                className={`block w-full text-left text-[15px] leading-5 font-bold break-words ${task.done ? "line-through" : "hover:underline"}`}
              >
                {task.title}
              </button>
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
              className="-mt-1 -mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-muted opacity-100 hover:bg-surface hover:text-ink focus-visible:opacity-100 data-[state=open]:opacity-100 sm:size-8 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
            >
              <MoreHorizontal size={18} strokeWidth={1.9} aria-hidden />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="z-50 min-w-[180px] rounded-card border border-line bg-white p-1.5 shadow-card-hover"
              >
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
