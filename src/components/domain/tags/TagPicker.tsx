"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, Plus, Settings2, Tag as TagIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { createTag } from "@/app/(app)/etiquetas/actions";
import { MAX_TAG_NAME, suggestColor, tagsFromIds, TAG_STYLES, toggleId, validateTagName, type TagWithUsage } from "@/lib/domain/tags";
import { fieldClass } from "@/lib/ui-colors";
import { TagChips } from "./TagChip";
import { TagManagerDialog } from "./TagManagerDialog";

/**
 * Elige las etiquetas de un proyecto o pendiente. Muestra las elegidas como chips y un botón
 * que abre la lista (con creación rápida y acceso a «Gestionar etiquetas»).
 */
export function TagPicker({
  tags,
  selectedIds,
  onChange,
  id,
}: {
  tags: TagWithUsage[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Ignora etiquetas que ya no existen (por ejemplo, eliminadas desde el administrador).
  const current = selectedIds.filter((x) => tags.some((t) => t.id === x));
  const selected = tagsFromIds(current, tags);

  function create(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation(); // el selector puede estar dentro de otro formulario (compositor, diálogo)
    const problem = validateTagName(tags, name);
    if (problem) return setError(problem);
    setError(null);
    startTransition(async () => {
      const result = await createTag({ name, color: suggestColor(tags) });
      if (!result.ok) return setError(result.error);
      onChange([...current, result.id]);
      setName("");
    });
  }

  return (
    <>
      {selected.length > 0 && <TagChips tags={selected} />}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          type="button"
          id={id}
          className="inline-flex h-10 items-center gap-1.5 rounded-input border border-dashed border-input-border bg-white px-3 text-[13px] font-semibold text-ink hover:bg-surface sm:h-[38px]"
        >
          <TagIcon size={16} strokeWidth={1.9} aria-hidden />
          {selected.length === 0 ? "Etiquetas" : `Etiquetas (${selected.length})`}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            aria-label="Elegir etiquetas"
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className="z-[60] w-[290px] max-w-[calc(100vw-1.5rem)] rounded-card border border-line bg-white p-2 shadow-card-hover"
          >
            {tags.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted">Aún no tienes etiquetas. Crea la primera aquí abajo.</p>
            ) : (
              <ul className="max-h-56 overflow-y-auto">
                {tags.map((t) => {
                  const on = current.includes(t.id);
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => onChange(toggleId(current, t.id))}
                        className="flex min-h-10 w-full items-center gap-2 rounded-input px-2 text-left text-sm font-semibold hover:bg-surface"
                      >
                        <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: TAG_STYLES[t.color].dot }} />
                        <span className="min-w-0 flex-1 truncate">{t.name}</span>
                        {on && (
                          <>
                            <Check size={16} strokeWidth={2.2} aria-hidden className="shrink-0 text-green-700" />
                            <span className="sr-only">(elegida)</span>
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <form onSubmit={create} noValidate aria-label="Crear etiqueta" className="mt-2 border-t border-surface pt-2">
              <div className="flex gap-1.5">
                <label htmlFor={`${id}-nueva`} className="sr-only">
                  Nombre de la nueva etiqueta
                </label>
                <input
                  id={`${id}-nueva`}
                  value={name}
                  maxLength={MAX_TAG_NAME}
                  autoComplete="off"
                  placeholder="Nueva etiqueta"
                  aria-invalid={error ? true : undefined}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  className={`${fieldClass} min-w-0`}
                />
                <button
                  type="submit"
                  disabled={pending || !name.trim()}
                  aria-label="Crear etiqueta"
                  className="flex size-10 shrink-0 items-center justify-center rounded-button bg-green-700 text-white hover:bg-green-700-hover disabled:opacity-50 lg:size-[38px]"
                >
                  <Plus size={18} strokeWidth={1.9} aria-hidden />
                </button>
              </div>
              {error && (
                <p role="alert" className="mt-1.5 px-0.5 text-[13px] font-semibold text-danger">
                  {error}
                </p>
              )}
            </form>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setManaging(true);
              }}
              className="mt-1 flex min-h-10 w-full items-center gap-2 rounded-input px-2 text-left text-[13px] font-bold text-green-700 hover:bg-green-50"
            >
              <Settings2 size={16} strokeWidth={1.9} aria-hidden />
              Gestionar etiquetas
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {managing && <TagManagerDialog open onOpenChange={(o) => !o && setManaging(false)} tags={tags} />}
    </>
  );
}

