"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, Tag as TagIcon, UserCog } from "lucide-react";
import { useState, useTransition } from "react";
import { logout } from "@/app/(auth)/login/actions";
import type { TagWithUsage } from "@/lib/domain/tags";
import { AccountDialog } from "./AccountDialog";
import { TagManagerDialog } from "./tags/TagManagerDialog";

const item =
  "flex w-full cursor-pointer items-center gap-2 rounded-input px-3 py-2.5 text-base font-medium outline-none data-[disabled]:opacity-60 data-[highlighted]:bg-surface sm:py-2 sm:text-sm";

export function AvatarMenu({
  initials,
  email,
  displayName,
  tags,
}: {
  initials: string;
  email: string;
  displayName: string;
  tags: TagWithUsage[];
}) {
  const [pending, startTransition] = useTransition();
  const [accountOpen, setAccountOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label="Menú de cuenta"
          className="flex size-10 items-center lg:size-8 justify-center rounded-full bg-green-700 text-xs font-bold text-white"
        >
          {initials}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-[220px] rounded-card border border-line bg-white p-1.5 shadow-card-hover"
          >
            <div className="px-3 py-2 text-xs break-all text-muted">{email}</div>
            <DropdownMenu.Separator className="my-1 h-px bg-line" />
            <DropdownMenu.Item className={item} onSelect={() => setAccountOpen(true)}>
              <UserCog size={18} strokeWidth={1.9} aria-hidden />
              Mi cuenta
            </DropdownMenu.Item>
            <DropdownMenu.Item className={item} onSelect={() => setTagsOpen(true)}>
              <TagIcon size={18} strokeWidth={1.9} aria-hidden />
              Etiquetas
            </DropdownMenu.Item>
            <DropdownMenu.Item
              disabled={pending}
              onSelect={(event) => {
                event.preventDefault();
                startTransition(() => logout());
              }}
              className={item}
            >
              <LogOut size={18} strokeWidth={1.9} aria-hidden />
              {pending ? "Saliendo…" : "Salir"}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {tagsOpen && <TagManagerDialog open onOpenChange={(o) => !o && setTagsOpen(false)} tags={tags} />}
      {accountOpen && <AccountDialog email={email} displayName={displayName} onClose={() => setAccountOpen(false)} />}
    </>
  );
}
