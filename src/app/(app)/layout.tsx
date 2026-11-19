import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import type { NotificationItem } from "@/components/domain/NotificationsBell";
import { TopBar, TopBarSkeleton } from "@/components/domain/TopBar";
import { createClient } from "@/lib/supabase/server";

function initialsOf(name: string) {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

async function AccountTopBar() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: settings }, { data: notifications }, { count: unread }] = await Promise.all([
    supabase.from("user_settings").select("display_name").maybeSingle(),
    supabase
      .from("notifications")
      .select("id, title, body, kind, project_id, created_at, read_at")
      .eq("channel", "in_app")
      .order("created_at", { ascending: false })
      .limit(15),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("channel", "in_app").is("read_at", null),
  ]);

  const items: NotificationItem[] = (notifications ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    href: n.project_id ? `/proyectos/${n.project_id}${n.kind === "task_due" ? "/fases" : ""}` : "/",
    createdAt: n.created_at,
    read: n.read_at !== null,
  }));

  const email = user?.email ?? "";
  const name = settings?.display_name || email.split("@")[0] || "?";

  return (
    <TopBar
      initials={initialsOf(name)}
      email={email}
      displayName={settings?.display_name ?? ""}
      notifications={items}
      unread={unread ?? 0}
    />
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-button focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-card-hover"
      >
        Saltar al contenido
      </a>
      <Suspense fallback={<TopBarSkeleton />}>
        <AccountTopBar />
      </Suspense>
      {children}
    </>
  );
}
