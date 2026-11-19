"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/** Diálogo centrado (`center`) o panel lateral derecho de 480 px (`side`). */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  variant = "center",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: "center" | "side";
  children: ReactNode;
}) {
  const position =
    variant === "side"
      ? "fixed top-0 right-0 bottom-0 w-[480px] max-w-full overflow-y-auto bg-white p-6 shadow-dialog"
      : "fixed top-10 left-1/2 w-[520px] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-dialog bg-white p-6 shadow-dialog";

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-[rgba(2,44,23,.55)]" />
        <RadixDialog.Content className={`${position} z-50`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <RadixDialog.Title className="text-[22px] leading-7 font-extrabold">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-1 text-sm text-muted">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              aria-label="Cerrar"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface"
            >
              <X size={18} strokeWidth={1.9} aria-hidden />
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
