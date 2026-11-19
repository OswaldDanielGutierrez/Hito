"use client";

import { useActionState } from "react";
import { APP_NAME } from "@/config/app";
import { login, type LoginState } from "./actions";

const initial: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <form
        action={action}
        className="w-full max-w-[400px] rounded-card border border-line bg-white p-8"
      >
        <div className="mb-6 flex items-center gap-2">
          <span aria-hidden className="inline-block size-4 rotate-45 rounded-[3px] bg-green-500" />
          <span className="text-base font-extrabold">{APP_NAME}</span>
        </div>
        <h1 className="mb-1 text-[22px] font-extrabold">Iniciar sesión</h1>
        <p className="mb-6 text-sm text-muted">Accede a tus proyectos.</p>

        <label htmlFor="email" className="mb-1 block text-xs font-medium text-muted">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mb-4 h-10 w-full rounded-input border border-input-border px-3 text-base sm:text-sm"
        />

        <label htmlFor="password" className="mb-1 block text-xs font-medium text-muted">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mb-4 h-10 w-full rounded-input border border-input-border px-3 text-base sm:text-sm"
        />

        {state.error && (
          <p role="alert" className="mb-4 text-sm font-medium text-danger">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-[38px] w-full rounded-button bg-green-700 text-sm font-semibold text-white transition-colors duration-[120ms] ease-out hover:bg-green-700-hover disabled:opacity-60"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
