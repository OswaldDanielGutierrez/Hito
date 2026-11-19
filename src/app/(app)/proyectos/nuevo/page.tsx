import { connection } from "next/server";
import { Suspense } from "react";
import { HomeContent } from "@/components/domain/HomeContent";
import { HomeSkeleton } from "@/components/domain/HomeSkeleton";
import { NewProjectDialog } from "@/components/domain/NewProjectDialog";
import { getTemplates } from "@/lib/data/templates";
import { todayInBogota } from "@/lib/domain/dates";
import { createClient } from "@/lib/supabase/server";

async function NewProjectLoader() {
  await connection();
  const supabase = await createClient();
  const [templates, userResult] = await Promise.all([getTemplates(), supabase.auth.getUser()]);
  if (!userResult.data.user) return null;
  return <NewProjectDialog templates={templates} today={todayInBogota()} userId={userResult.data.user.id} />;
}

export default function NewProjectPage() {
  return (
    <>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent filter="all" />
      </Suspense>
      <Suspense fallback={null}>
        <NewProjectLoader />
      </Suspense>
    </>
  );
}
