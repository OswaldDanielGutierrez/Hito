import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
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
  const { data: settings } = await supabase.from("user_settings").select("display_name").maybeSingle();

  const email = user?.email ?? "";
  const name = settings?.display_name || email.split("@")[0] || "?";

  return <TopBar initials={initialsOf(name)} email={email} />;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<TopBarSkeleton />}>
        <AccountTopBar />
      </Suspense>
      {children}
    </>
  );
}
