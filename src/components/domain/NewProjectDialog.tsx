"use client";

import { CalendarDays, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setProjectTags } from "@/app/(app)/etiquetas/actions";
import { createProject } from "@/app/(app)/proyectos/actions";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { Dialog } from "@/components/ui/Dialog";
import { TagPicker } from "@/components/domain/tags/TagPicker";
import type { TemplateData } from "@/lib/data/templates";
import { addDays, formatDate } from "@/lib/domain/dates";
import { finalDeliveryDate } from "@/lib/domain/progress";
import type { TagWithUsage } from "@/lib/domain/tags";
import { detectResource, normalizeUrl, suggestResourceName } from "@/lib/domain/resourceDetect";
import { calculatePhaseDates, hasDatesOutOfOrder } from "@/lib/domain/templates";
import { resourceKindLabel } from "@/lib/labels";
import { fieldClass, labelClass } from "@/lib/ui-colors";
import { MAX_FILE_MB, uploadProjectFile } from "@/components/domain/resources/upload";

interface PhaseRow {
  key: string;
  name: string;
  date: string;
}

interface LinkRow {
  key: string;
  url: string;
  name: string;
}

const STEPS = ["1 · Datos generales", "2 · Fases y fechas estimadas", "3 · Recursos"];
const NEXT_LABEL = ["Fases y fechas", "Recursos"];

const newKey = () => crypto.randomUUID();

export function NewProjectDialog({
  templates,
  today,
  userId,
  tags,
}: {
  templates: TemplateData[];
  today: string;
  userId: string;
  tags: TagWithUsage[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [responsible, setResponsible] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [tagIds, setTagIds] = useState<string[]>([]);

  const [templateId, setTemplateId] = useState<string | null>(null);
  const [rows, setRows] = useState<PhaseRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [notifyPhase, setNotifyPhase] = useState(true);

  const [links, setLinks] = useState<LinkRow[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const [error, setError] = useState<string | null>(null);

  const template = templates.find((t) => t.id === templateId) ?? null;
  const finalDate = finalDeliveryDate(rows.map((r) => ({ estimatedDate: r.date || null })));
  const outOfOrder = hasDatesOutOfOrder(rows.map((r) => r.date || null));

  function close() {
    router.push("/");
  }

  function applyTemplate(t: TemplateData, from: string) {
    setRows(calculatePhaseDates(from, t.phases).map((p) => ({ key: newKey(), name: p.name, date: p.date })));
    setDirty(false);
  }

  function chooseTemplate(t: TemplateData) {
    setTemplateId(t.id);
    applyTemplate(t, startDate);
  }

  function updateRow(key: string, patch: Partial<PhaseRow>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setDirty(true);
  }

  function addRow() {
    const last = rows.at(-1)?.date || startDate;
    setRows((rs) => [...rs, { key: newKey(), name: "", date: last ? addDays(last, 7) : "" }]);
    setDirty(true);
  }

  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r.key !== key));
    setDirty(true);
  }

  function addLink() {
    const href = normalizeUrl(linkInput);
    if (!href) return setLinkError("Escribe un enlace web válido, por ejemplo https://github.com/…");
    if (links.some((l) => l.url === href)) return setLinkError("Ese enlace ya está en la lista");
    setLinks((ls) => [...ls, { key: newKey(), url: href, name: suggestResourceName(href) }]);
    setLinkInput("");
    setLinkError(null);
  }

  function validateStep(current: number): string | null {
    if (current === 0) {
      if (!name.trim()) return "Escribe el nombre del proyecto";
      if (!startDate) return "Elige la fecha de inicio";
    }
    if (current === 1) {
      if (rows.length === 0) return "Agrega al menos una fase";
      if (rows.some((r) => !r.name.trim())) return "Cada fase necesita un nombre";
      if (rows.some((r) => !r.date)) return "Cada fase necesita una fecha estimada";
    }
    if (current === 2 && links.some((l) => !l.name.trim())) return "Cada recurso necesita un nombre";
    return null;
  }

  function goNext() {
    const problem = validateStep(step);
    if (problem) return setError(problem);
    setError(null);
    if (step === 0 && template && !dirty) applyTemplate(template, startDate);
    setStep(step + 1);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 2) return goNext();

    const problem = validateStep(0) ?? validateStep(1) ?? validateStep(2);
    if (problem) return setError(problem);
    setError(null);

    startTransition(async () => {
      const result = await createProject({
        name,
        area,
        description,
        responsible,
        startDate,
        phases: rows.map((r) => ({ name: r.name, date: r.date })),
        resources: links.map((l) => ({ url: l.url, name: l.name })),
        notifyPhase,
      });
      if (!result.ok) return setError(result.error);

      // Las etiquetas son opcionales: si fallan, el proyecto ya existe y se pueden asignar después.
      const chosen = tagIds.filter((id) => tags.some((t) => t.id === id));
      if (chosen.length > 0) {
        const tagged = await setProjectTags({ projectId: result.projectId, tagIds: chosen });
        if (!tagged.ok) toast(`El proyecto se creó, pero no se pudieron guardar las etiquetas: ${tagged.error}`, "error");
      }

      const failed: string[] = [];
      for (const file of files) {
        const uploaded = await uploadProjectFile({ file, projectId: result.projectId, userId, phaseId: null });
        if (!uploaded.ok) failed.push(uploaded.error);
      }
      toast("Proyecto creado");
      if (failed.length > 0) toast(`${failed.length === 1 ? "Un archivo no se pudo subir" : `${failed.length} archivos no se pudieron subir`}: ${failed[0]}`, "error");
      router.push(`/proyectos/${result.projectId}`);
    });
  }

  const subtitle = [name.trim(), area.trim()].filter(Boolean).join(" · ") || "Nuevo proyecto";

  return (
    <Dialog open onOpenChange={(open) => !open && close()} title="Registrar proyecto" description={subtitle} variant="wide">
      <ol className="mb-6 grid grid-cols-3 gap-3">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}>
            <div className={`mb-2 h-1 rounded-pill ${i <= step ? "bg-green-700" : "bg-line"}`} />
            <span
              className={`text-[13px] ${i === step ? "font-extrabold" : i < step ? "font-semibold text-green-700-hover" : "text-muted"}`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      <form onSubmit={submit} noValidate>
        {step === 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="np-name" className={labelClass}>
                Nombre <span aria-hidden>*</span>
              </label>
              <input id="np-name" required autoFocus maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="np-area" className={labelClass}>
                Área
              </label>
              <input id="np-area" maxLength={120} value={area} onChange={(e) => setArea(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="np-responsible" className={labelClass}>
                Responsable
              </label>
              <input
                id="np-responsible"
                maxLength={120}
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="np-description" className={labelClass}>
                Descripción
              </label>
              <textarea
                id="np-description"
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-input border border-input-border bg-white px-3 py-2 text-base sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="np-start" className={labelClass}>
                Fecha de inicio
              </label>
              <input id="np-start" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldClass} />
            </div>
            <div className="sm:col-span-2">
              <span className={labelClass}>Etiquetas (opcional)</span>
              <div className="flex flex-wrap items-center gap-2">
                <TagPicker id="np-tags" tags={tags} selectedIds={tagIds} onChange={setTagIds} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="mb-2 text-sm font-extrabold">Empieza con una plantilla</h3>
              <div className="flex flex-wrap gap-3">
                {templates.map((t) => {
                  const selected = t.id === templateId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => chooseTemplate(t)}
                      className={`rounded-button px-4 py-2.5 text-left transition-colors duration-[120ms] ease-out ${
                        selected ? "border-2 border-green-700 bg-green-50" : "border border-line bg-white hover:border-input-border"
                      }`}
                    >
                      <span className="block text-sm font-bold">{t.name}</span>
                      <span className="block text-xs text-muted">{t.phases.length} fases</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <ul className="flex flex-col gap-2.5">
              {rows.map((r, i) => (
                <li key={r.key} className="grid grid-cols-[32px_1fr_36px] items-center gap-x-3 gap-y-2 sm:grid-cols-[32px_1fr_180px_36px]">
                  <span aria-hidden className="flex size-7 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-green-700-hover">
                    {i + 1}
                  </span>
                  <input
                    aria-label={`Nombre de la fase ${i + 1}`}
                    maxLength={80}
                    value={r.name}
                    onChange={(e) => updateRow(r.key, { name: e.target.value })}
                    className={fieldClass}
                  />
                  <input
                    aria-label={`Fecha estimada de la fase ${i + 1}`}
                    type="date"
                    value={r.date}
                    onChange={(e) => updateRow(r.key, { date: e.target.value })}
                    className={`${fieldClass} col-start-2 sm:col-start-auto`}
                  />
                  <button
                    type="button"
                    aria-label={`Quitar la fase ${i + 1}`}
                    onClick={() => removeRow(r.key)}
                    className="col-start-3 row-start-1 flex size-10 items-center justify-center rounded-input text-muted hover:bg-surface hover:text-ink sm:col-start-auto sm:row-start-auto sm:size-9"
                  >
                    <X size={18} strokeWidth={1.9} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={addRow}
              className="flex h-10 items-center justify-center gap-2 rounded-button border-2 border-dashed border-green-200 text-sm font-bold text-green-700 hover:bg-green-50"
            >
              <Plus size={18} strokeWidth={1.9} aria-hidden />
              Agregar fase
            </button>

            {outOfOrder && (
              <p role="status" className="rounded-button bg-[#FDF0E3] px-3.5 py-2 text-[13px] font-semibold text-warn">
                Algunas fechas no van en orden. Puedes continuar, pero revisa el calendario.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-page px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays size={18} strokeWidth={1.9} aria-hidden className="text-green-700" />
                Entrega final estimada: {finalDate ? formatDate(finalDate) : "—"} · {rows.length} {rows.length === 1 ? "fase" : "fases"}
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notifyPhase} onChange={(e) => setNotifyPhase(e.target.checked)} className="size-4 accent-green-700" />
                Avisarme 2 días antes de cada fase
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              Opcional. Pega enlaces de documentos, flujos, repositorios o diseños; detecto el tipo por el dominio (SharePoint,
              Power Automate, GitHub, Figma o cualquier URL). También puedes adjuntar archivos.
            </p>

            <div>
              <label htmlFor="np-link" className={labelClass}>
                Enlace
              </label>
              <div className="flex gap-3">
                <input
                  id="np-link"
                  value={linkInput}
                  onChange={(e) => {
                    setLinkInput(e.target.value);
                    setLinkError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLink();
                    }
                  }}
                  placeholder="https://github.com/mi-organizacion/mi-repo"
                  className={fieldClass}
                />
                <Button type="button" variant="secondary" onClick={addLink}>
                  Agregar
                </Button>
              </div>
              {linkError && (
                <p role="alert" className="mt-1 text-xs font-medium text-danger">
                  {linkError}
                </p>
              )}
            </div>

            {links.length > 0 && (
              <ul className="flex flex-col gap-2.5">
                {links.map((l, i) => {
                  const detected = detectResource(l.url);
                  return (
                    <li key={l.key} className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <input
                        aria-label={`Nombre del recurso ${i + 1}`}
                        maxLength={160}
                        value={l.name}
                        onChange={(e) => setLinks((ls) => ls.map((x) => (x.key === l.key ? { ...x, name: e.target.value } : x)))}
                        className={`${fieldClass} min-w-0 flex-1 basis-[200px]`}
                      />
                      <span className="order-3 rounded-pill bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft sm:order-2">
                        {detected ? `${resourceKindLabel[detected.kind]} · ${detected.origin}` : "Enlace"}
                      </span>
                      <button
                        type="button"
                        aria-label={`Quitar el recurso ${i + 1}`}
                        onClick={() => setLinks((ls) => ls.filter((x) => x.key !== l.key))}
                        className="order-2 flex size-10 items-center justify-center rounded-input text-muted hover:bg-surface hover:text-ink sm:order-3 sm:size-9"
                      >
                        <X size={18} strokeWidth={1.9} aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div>
              <label htmlFor="np-files" className={labelClass}>
                Archivos (máx. {MAX_FILE_MB} MB cada uno)
              </label>
              <input
                id="np-files"
                type="file"
                multiple
                onChange={(e) => {
                  const picked = [...(e.target.files ?? [])];
                  e.target.value = "";
                  setFiles((current) => [...current, ...picked]);
                }}
                className="block w-full text-base file:mr-3 file:h-10 file:rounded-button file:border file:border-input-border file:bg-white file:px-4 file:text-sm file:font-semibold sm:text-sm"
              />
              {files.length > 0 && (
                <ul className="mt-2.5 flex flex-col gap-2">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-input bg-page px-3 py-2 text-sm">
                      <span className="min-w-0 flex-1 break-words">{f.name}</span>
                      <span className="shrink-0 text-xs text-muted">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button
                        type="button"
                        aria-label={`Quitar el archivo ${f.name}`}
                        onClick={() => setFiles((current) => current.filter((_, j) => j !== i))}
                        className="flex size-9 shrink-0 items-center justify-center rounded-input text-muted hover:bg-surface hover:text-ink"
                      >
                        <X size={16} strokeWidth={1.9} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="sticky bottom-0 -mx-5 mt-6 flex items-center gap-3 border-t border-line bg-white px-5 py-4 sm:static sm:mx-0 sm:px-0 sm:pt-5 sm:pb-0">
          <Button type="button" variant="secondary" disabled={step === 0 || pending} onClick={() => { setError(null); setStep(step - 1); }}>
            Atrás
          </Button>
          <Button type="button" variant="text" className="ml-auto" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" className="grow sm:grow-0" disabled={pending}>
            {step < 2 ? (
              <>
                Siguiente<span className="hidden sm:inline">: {NEXT_LABEL[step]}</span>
              </>
            ) : pending ? (
              "Creando…"
            ) : (
              "Crear proyecto"
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
