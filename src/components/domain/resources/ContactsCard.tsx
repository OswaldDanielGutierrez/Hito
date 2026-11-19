"use client";

import { Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteContact, saveContact } from "@/app/(app)/proyectos/[id]/recursos/actions";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import type { ContactData } from "@/lib/data/project";
import { fieldClass, labelClass } from "@/lib/ui-colors";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.trim().slice(0, 2)).toUpperCase();
}

export function ContactsCard({ projectId, contacts }: { projectId: string; contacts: ContactData[] }) {
  const [dialog, setDialog] = useState<{ contact: ContactData | null } | null>(null);

  return (
    <section aria-labelledby="contactos-titulo" className="min-w-0 rounded-card border border-line bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="contactos-titulo" className="text-base font-extrabold">
          Contactos
        </h2>
        <button
          type="button"
          onClick={() => setDialog({ contact: null })}
          className="h-9 rounded-button px-3 text-[13px] font-bold text-green-700 hover:bg-green-50"
        >
          Agregar
        </button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay contactos.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-green-700-hover"
              >
                {initialsOf(c.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold break-words">{c.name}</div>
                {c.role && <div className="text-xs text-muted">{c.role}</div>}
                {c.detail && <div className="text-xs break-words text-muted">{c.detail}</div>}
              </div>
              <button
                type="button"
                aria-label={`Editar a ${c.name}`}
                onClick={() => setDialog({ contact: c })}
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink sm:size-9"
              >
                <Pencil size={16} strokeWidth={1.9} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {dialog && <ContactDialog projectId={projectId} contact={dialog.contact} onClose={() => setDialog(null)} />}
    </section>
  );
}

function ContactDialog({ projectId, contact, onClose }: { projectId: string; contact: ContactData | null; onClose: () => void }) {
  const [name, setName] = useState(contact?.name ?? "");
  const [role, setRole] = useState(contact?.role ?? "");
  const [detail, setDetail] = useState(contact?.detail ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveContact({ projectId, contactId: contact?.id, name, role, detail });
      if (result.ok) {
        toast(contact ? "Contacto actualizado" : "Contacto agregado");
        onClose();
      }
      else setError(result.error);
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title={contact ? "Editar contacto" : "Nuevo contacto"}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Nombre
          </label>
          <input id="contact-name" required autoFocus maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="contact-role" className={labelClass}>
            Rol
          </label>
          <input id="contact-role" maxLength={120} value={role} onChange={(e) => setRole(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="contact-detail" className={labelClass}>
            Detalle (correo, teléfono…)
          </label>
          <input id="contact-detail" maxLength={300} value={detail} onChange={(e) => setDetail(e.target.value)} className={fieldClass} />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {contact &&
            (confirmDelete ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await deleteContact({ contactId: contact.id });
                    if (result.ok) onClose();
                    else setError(result.error);
                  })
                }
                className="h-[38px] rounded-button bg-danger px-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Confirmar eliminación
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="text-sm font-bold text-danger hover:underline">
                Eliminar contacto
              </button>
            ))}
          <Button type="button" variant="text" className="ml-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
