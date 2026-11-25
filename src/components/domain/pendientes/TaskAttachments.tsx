"use client";

import { ExternalLink, FileText, Link as LinkIcon, Paperclip, Plus, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { addLinkAttachment, deleteAttachment } from "@/app/(app)/pendientes/[id]/actions";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { formatDate, todayInBogota } from "@/lib/domain/dates";
import { fieldClass, labelClass } from "@/lib/ui-colors";
import { MAX_FILE_MB, uploadTaskFile } from "./upload";

export interface TaskAttachmentView {
  id: string;
  kind: "file" | "link";
  name: string;
  url: string | null;
  source: string | null;
  createdAt: string;
}

const dangerButton =
  "inline-flex h-10 items-center justify-center rounded-button bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60 lg:h-[38px]";

/** Adjuntos del pendiente: archivos subidos y enlaces. */
export function TaskAttachments({
  quickTaskId,
  userId,
  attachments,
}: {
  quickTaskId: string;
  userId: string;
  attachments: TaskAttachmentView[];
}) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addLinkAttachment({ quickTaskId, url, name });
      if (!result.ok) return setError(result.error);
      setUrl("");
      setName("");
    });
  }

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const failures: string[] = [];
    for (const file of Array.from(files)) {
      const result = await uploadTaskFile({ file, quickTaskId, userId });
      if (!result.ok) failures.push(result.error);
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    if (failures.length > 0) setError(failures.join(" · "));
    else toast(files.length === 1 ? "Archivo adjuntado" : "Archivos adjuntados");
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteAttachment({ id });
      if (!result.ok) return toast(result.error, "error");
      setConfirmingId(null);
    });
  }

  return (
    <section aria-labelledby="adjuntos" className="rounded-card border border-line bg-white p-4">
      <h2 id="adjuntos" className="text-base font-extrabold">
        Adjuntos
      </h2>
      <p className="mb-3 text-[13px] text-muted">Archivos (hasta {MAX_FILE_MB} MB) y enlaces de este pendiente.</p>

      {attachments.length === 0 ? (
        <p className="mb-3 text-sm text-muted">Aún no hay adjuntos.</p>
      ) : (
        <ul className="mb-3 flex flex-col gap-2">
          {attachments.map((a) => {
            const href = a.kind === "file" ? `/pendientes/${quickTaskId}/adjuntos/${a.id}` : (a.url ?? "#");
            return (
              <li key={a.id} className="rounded-input bg-surface px-3 py-2.5">
                <div className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-0.5 shrink-0 text-green-700">
                    {a.kind === "file" ? <FileText size={18} strokeWidth={1.9} /> : <LinkIcon size={18} strokeWidth={1.9} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 text-sm font-bold break-words hover:underline"
                    >
                      <span className="min-w-0 break-words">{a.name}</span>
                      <ExternalLink size={13} strokeWidth={1.9} aria-hidden className="shrink-0 text-muted" />
                      <span className="sr-only">(se abre en una pestaña nueva)</span>
                    </a>
                    <div className="text-xs text-muted">
                      {[a.source, formatDate(todayInBogota(new Date(a.createdAt)))].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {confirmingId !== a.id && (
                    <Button
                      type="button"
                      variant="text"
                      aria-label={`Eliminar adjunto ${a.name}`}
                      className="-mr-2 -mt-1.5 hover:!text-danger"
                      onClick={() => setConfirmingId(a.id)}
                    >
                      <Trash2 size={15} strokeWidth={1.9} aria-hidden />
                    </Button>
                  )}
                </div>
                {confirmingId === a.id && (
                  <div role="alert" className="mt-2 flex flex-wrap items-center justify-end gap-2">
                    <span className="mr-auto text-xs font-semibold">
                      {a.kind === "file" ? "¿Eliminar el archivo? No se puede deshacer." : "¿Quitar el enlace?"}
                    </span>
                    <Button type="button" variant="text" onClick={() => setConfirmingId(null)}>
                      No
                    </Button>
                    <button type="button" disabled={pending} className={dangerButton} onClick={() => remove(a.id)}>
                      Sí, eliminar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-3 border-t border-surface pt-3">
        <div>
          <input
            ref={fileInput}
            id="adjuntar-archivo"
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => void upload(e.target.files)}
          />
          <label
            htmlFor="adjuntar-archivo"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-button border border-input-border bg-white px-4 text-sm font-semibold hover:bg-surface has-[:focus-visible]:outline-2 lg:h-[38px]"
          >
            <Paperclip size={16} strokeWidth={1.9} aria-hidden />
            {uploading ? "Subiendo…" : "Adjuntar archivo"}
          </label>
        </div>

        <form onSubmit={addLink} noValidate aria-label="Agregar enlace" className="flex flex-col gap-2">
          <div>
            <label htmlFor="adjunto-enlace" className={labelClass}>
              Enlace
            </label>
            <input
              id="adjunto-enlace"
              value={url}
              inputMode="url"
              autoComplete="off"
              placeholder="Pega un enlace (SharePoint, GitHub…)"
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="adjunto-enlace-nombre" className={labelClass}>
              Nombre (opcional)
            </label>
            <input
              id="adjunto-enlace-nombre"
              value={name}
              maxLength={160}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" disabled={pending || !url.trim()}>
              <Plus size={16} strokeWidth={1.9} aria-hidden />
              Agregar enlace
            </Button>
          </div>
        </form>

        {error && (
          <p role="alert" className="text-[13px] font-semibold text-danger">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
