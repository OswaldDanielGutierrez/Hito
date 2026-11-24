"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { createTag, deleteTag, updateTag } from "@/app/(app)/etiquetas/actions";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import { MAX_TAG_NAME, suggestColor, usageText, validateTagName, type TagColor, type TagWithUsage } from "@/lib/domain/tags";
import { fieldClass, labelClass } from "@/lib/ui-colors";
import { ColorSwatches } from "./ColorSwatches";
import { TagChip } from "./TagChip";

const dangerButton =
  "inline-flex h-10 items-center justify-center rounded-button bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60 lg:h-[38px]";

export function TagManagerDialog({
  open,
  onOpenChange,
  tags,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: TagWithUsage[];
}) {
  const [pending, startTransition] = useTransition();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<TagColor | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<TagColor>("green");
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const color = newColor ?? suggestColor(tags);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateTagName(tags, newName);
    if (problem) return setCreateError(problem);
    setCreateError(null);
    startTransition(async () => {
      const result = await createTag({ name: newName, color });
      if (!result.ok) return setCreateError(result.error);
      toast("Etiqueta creada");
      setNewName("");
      setNewColor(null);
    });
  }

  function startEdit(tag: TagWithUsage) {
    setDeletingId(null);
    setEditError(null);
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const problem = validateTagName(tags, editName, editingId);
    if (problem) return setEditError(problem);
    setEditError(null);
    startTransition(async () => {
      const result = await updateTag({ id: editingId, name: editName, color: editColor });
      if (!result.ok) return setEditError(result.error);
      toast("Etiqueta actualizada");
      setEditingId(null);
    });
  }

  function remove(tag: TagWithUsage) {
    startTransition(async () => {
      const result = await deleteTag({ id: tag.id });
      if (!result.ok) return toast(result.error, "error");
      toast(`Etiqueta «${tag.name}» eliminada`);
      setDeletingId(null);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Etiquetas"
      description="Agrupa tus proyectos y pendientes, por ejemplo por tecnología: Power Apps, Power Automate…"
    >
      <form onSubmit={add} className="flex flex-col gap-3" noValidate aria-label="Crear etiqueta">
        <div>
          <label htmlFor="etiqueta-nueva" className={labelClass}>
            Nueva etiqueta
          </label>
          <div className="flex gap-2">
            <input
              id="etiqueta-nueva"
              value={newName}
              maxLength={MAX_TAG_NAME}
              autoComplete="off"
              placeholder="Ej.: Power Apps"
              aria-invalid={createError ? true : undefined}
              aria-describedby={createError ? "etiqueta-nueva-error" : undefined}
              onChange={(e) => {
                setNewName(e.target.value);
                setCreateError(null);
              }}
              className={fieldClass}
            />
            <Button type="submit" disabled={pending || !newName.trim()}>
              <Plus size={18} strokeWidth={1.9} aria-hidden />
              Agregar
            </Button>
          </div>
          {createError && (
            <p id="etiqueta-nueva-error" role="alert" className="mt-1.5 text-[13px] font-semibold text-danger">
              {createError}
            </p>
          )}
        </div>
        <ColorSwatches label="Color de la nueva etiqueta" value={color} onChange={setNewColor} />
      </form>

      <div className="mt-5 border-t border-line pt-4">
        <h3 className="mb-2 text-sm font-extrabold">Tus etiquetas ({tags.length})</h3>
        {tags.length === 0 ? (
          <p className="rounded-card border-2 border-dashed border-green-200 px-4 py-5 text-center text-sm text-muted">
            Aún no tienes etiquetas. Crea la primera arriba.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-surface">
            {tags.map((tag) => {
              if (editingId === tag.id) {
                return (
                  <li key={tag.id} className="py-3">
                    <form onSubmit={saveEdit} className="flex flex-col gap-3" noValidate aria-label={`Editar etiqueta ${tag.name}`}>
                      <div>
                        <label htmlFor={`etiqueta-${tag.id}`} className={labelClass}>
                          Nombre
                        </label>
                        <input
                          id={`etiqueta-${tag.id}`}
                          autoFocus
                          value={editName}
                          maxLength={MAX_TAG_NAME}
                          autoComplete="off"
                          aria-invalid={editError ? true : undefined}
                          aria-describedby={editError ? `etiqueta-${tag.id}-error` : undefined}
                          onChange={(e) => {
                            setEditName(e.target.value);
                            setEditError(null);
                          }}
                          className={fieldClass}
                        />
                        {editError && (
                          <p id={`etiqueta-${tag.id}-error`} role="alert" className="mt-1.5 text-[13px] font-semibold text-danger">
                            {editError}
                          </p>
                        )}
                      </div>
                      <ColorSwatches label={`Color de ${tag.name}`} value={editColor} onChange={setEditColor} />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="text" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={pending || !editName.trim()}>
                          Guardar
                        </Button>
                      </div>
                    </form>
                  </li>
                );
              }

              if (deletingId === tag.id) {
                return (
                  <li key={tag.id} className="py-3">
                    <p className="text-sm">
                      ¿Eliminar <strong>«{tag.name}»</strong>? {usageText(tag)}; se quitará de todos ellos. Esta acción no se puede deshacer.
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <Button type="button" variant="text" onClick={() => setDeletingId(null)}>
                        Cancelar
                      </Button>
                      <button type="button" disabled={pending} onClick={() => remove(tag)} className={dangerButton}>
                        Eliminar etiqueta
                      </button>
                    </div>
                  </li>
                );
              }

              return (
                <li key={tag.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <div className="flex min-w-0 flex-1 basis-40 flex-col items-start gap-0.5">
                    <TagChip tag={tag} />
                    <span className="text-xs text-muted">{usageText(tag)}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="text" onClick={() => startEdit(tag)} aria-label={`Editar etiqueta ${tag.name}`}>
                      <Pencil size={16} strokeWidth={1.9} aria-hidden />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      onClick={() => {
                        setEditingId(null);
                        setDeletingId(tag.id);
                      }}
                      aria-label={`Eliminar etiqueta ${tag.name}`}
                      className="hover:!text-danger"
                    >
                      <Trash2 size={16} strokeWidth={1.9} aria-hidden />
                      Eliminar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
