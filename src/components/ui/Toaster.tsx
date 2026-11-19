"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Kind = "success" | "error";
interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
}

const EVENT = "hito:toast";
let counter = 0;

/** Muestra un aviso breve en la esquina inferior (abajo y centrado en móvil). */
export function toast(message: string, kind: Kind = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastItem>(EVENT, { detail: { id: ++counter, kind, message } }));
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const onToast = (e: Event) => {
      const item = (e as CustomEvent<ToastItem>).detail;
      setItems((list) => [...list, item]);
      const timer = setTimeout(() => {
        setItems((list) => list.filter((t) => t.id !== item.id));
        timers.delete(timer);
      }, item.kind === "error" ? 7000 : 4000);
      timers.add(timer);
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex w-full max-w-[380px] items-start gap-2.5 rounded-card border bg-white px-3.5 py-3 text-sm font-medium shadow-card-hover ${
            t.kind === "error" ? "border-[#F2C3BE] text-danger" : "border-green-100 text-ink"
          }`}
        >
          {t.kind === "error" ? (
            <XCircle size={18} strokeWidth={1.9} aria-hidden className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={18} strokeWidth={1.9} aria-hidden className="mt-0.5 shrink-0 text-green-700" />
          )}
          <span className="min-w-0 flex-1 break-words">{t.message}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setItems((list) => list.filter((x) => x.id !== t.id))}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface"
          >
            <X size={14} strokeWidth={1.9} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
