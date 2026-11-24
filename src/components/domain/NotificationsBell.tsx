"use client";

import * as Popover from "@radix-ui/react-popover";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/(app)/notificaciones/actions";

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  href: string;
  createdAt: string;
  read: boolean;
}

export function NotificationsBell({ items, unread }: { items: NotificationItem[]; unread: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={unread > 0 ? `Notificaciones: ${unread} sin leer` : "Notificaciones"}
        className="relative flex size-10 items-center justify-center rounded-full text-green-200 hover:bg-green-800 hover:text-white sm:size-9"
      >
        <Bell size={18} strokeWidth={1.9} aria-hidden />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute top-0.5 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-300 px-1 text-[10px] leading-none font-extrabold text-green-900"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          aria-label="Notificaciones"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[min(380px,calc(100vw-1.5rem))] rounded-card border border-line bg-white shadow-card-hover"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 className="text-sm font-extrabold">Notificaciones</h2>
            <button
              type="button"
              disabled={pending || unread === 0}
              onClick={() => startTransition(async () => void (await markAllNotificationsRead()))}
              className="text-[13px] font-bold text-green-700 hover:underline disabled:text-muted disabled:no-underline"
            >
              Marcar todas como leídas
            </button>
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">No tienes notificaciones todavía.</p>
          ) : (
            <ul className="max-h-[min(420px,60dvh)] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="border-b border-surface last:border-b-0">
                  <Link
                    href={n.href}
                    onClick={() => {
                      setOpen(false);
                      if (!n.read) startTransition(async () => void (await markNotificationRead({ id: n.id })));
                    }}
                    className={`flex gap-3 px-4 py-3 hover:bg-page ${n.read ? "" : "bg-[#F4FBF7]"}`}
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-green-500"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="sr-only">{n.read ? "Leída. " : "Sin leer. "}</span>
                      <span className={`block text-sm break-words ${n.read ? "font-medium" : "font-bold"}`}>{n.title}</span>
                      {n.body && <span className="block text-xs break-words text-muted">{n.body}</span>}
                      <span className="mt-0.5 block text-[11px] text-muted">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
