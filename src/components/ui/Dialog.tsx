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
  variant?: "center" | "wide" | "side";
  children: ReactNode;
}) {
  const centered =
    "fixed top-4 left-1/2 max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1.5rem)] -translate-x-1/2 overflow-y-auto rounded-dialog bg-white shadow-dialog sm:top-10 sm:max-h-[calc(100dvh-5rem)] sm:max-w-[calc(100%-2rem)]";
  const position =
    variant === "side"
      ? "fixed top-0 right-0 bottom-0 w-[480px] max-w-full overflow-y-auto bg-white p-5 shadow-dialog sm:p-6"
      : variant === "wide"
        ? `${centered} w-[820px] p-5 sm:p-7`
        : `${centered} w-[520px] p-5 sm:p-6`;

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-[rgba(2,44,23,.55)]" />
        <RadixDialog.Content className={`${position} z-50`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <RadixDialog.Title className="text-xl leading-7 font-extrabold sm:text-[22px]">{title}</RadixDialog.Title>
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
