"use client";

import { useState, useTransition } from "react";
import { updateDisplayName } from "@/app/(app)/cuenta/actions";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "@/lib/domain/password";
import { createClient } from "@/lib/supabase/client";
import { fieldClass, labelClass } from "@/lib/ui-colors";

export function AccountDialog({ email, displayName, onClose }: { email: string; displayName: string; onClose: () => void }) {
  const [name, setName] = useState(displayName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [namePending, startName] = useTransition();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordPending, startPassword] = useTransition();

  function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    startName(async () => {
      const result = await updateDisplayName({ name });
      if (result.ok) toast("Nombre actualizado");
      else setNameError(result.error);
    });
  }

  function savePassword(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateNewPassword(current, next, confirm);
    if (problem) return setPasswordError(problem);
    setPasswordError(null);

    startPassword(async () => {
      const supabase = createClient();
      const check = await supabase.auth.signInWithPassword({ email, password: current });
      if (check.error) return setPasswordError("La contraseña actual no es correcta");

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) return setPasswordError(error.message);

      setCurrent("");
      setNext("");
      setConfirm("");
      toast("Contraseña actualizada");
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title="Mi cuenta" description={email}>
      <form onSubmit={saveName} className="flex flex-col gap-3" noValidate>
        <h3 className="text-sm font-extrabold">Tu nombre</h3>
        <div>
          <label htmlFor="acc-name" className={labelClass}>
            Nombre para el saludo
          </label>
          <input id="acc-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </div>
        {nameError && (
          <p role="alert" className="text-sm font-medium text-danger">
            {nameError}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" disabled={namePending || !name.trim() || name.trim() === displayName}>
            {namePending ? "Guardando…" : "Guardar nombre"}
          </Button>
        </div>
      </form>

      <form onSubmit={savePassword} className="mt-5 flex flex-col gap-3 border-t border-line pt-5" noValidate>
        <h3 className="text-sm font-extrabold">Cambiar contraseña</h3>
        <div>
          <label htmlFor="acc-current" className={labelClass}>
            Contraseña actual
          </label>
          <input
            id="acc-current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="acc-new" className={labelClass}>
            Nueva contraseña (mínimo {MIN_PASSWORD_LENGTH} caracteres, con letras y números)
          </label>
          <input
            id="acc-new"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="acc-confirm" className={labelClass}>
            Repite la nueva contraseña
          </label>
          <input
            id="acc-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={fieldClass}
          />
        </div>
        {passwordError && (
          <p role="alert" className="text-sm font-medium text-danger">
            {passwordError}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="text" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="submit" disabled={passwordPending}>
            {passwordPending ? "Cambiando…" : "Cambiar contraseña"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
