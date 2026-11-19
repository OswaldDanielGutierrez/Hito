"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { logout } from "@/app/(auth)/login/actions";

export function AvatarMenu({ initials, email }: { initials: string; email: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Menú de cuenta"
        className="flex size-8 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white"
      >
        {initials}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[220px] rounded-card border border-line bg-white p-1.5 shadow-card-hover"
        >
          <div className="px-3 py-2 text-xs text-muted">{email}</div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item
            disabled={pending}
            onSelect={(event) => {
              event.preventDefault();
              startTransition(() => logout());
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-input px-3 py-2 text-base sm:text-sm font-medium outline-none data-[disabled]:opacity-60 data-[highlighted]:bg-surface"
          >
            <LogOut size={18} strokeWidth={1.9} aria-hidden />
            {pending ? "Saliendo…" : "Salir"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
