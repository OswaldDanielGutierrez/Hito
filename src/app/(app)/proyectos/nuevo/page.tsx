import { connection } from "next/server";
import { Suspense } from "react";
import { HomeContent } from "@/components/domain/HomeContent";
import { HomeSkeleton } from "@/components/domain/HomeSkeleton";
import { NewProjectDialog } from "@/components/domain/NewProjectDialog";
import { getTemplates } from "@/lib/data/templates";
import { todayInBogota } from "@/lib/domain/dates";

async function NewProjectLoader() {
  await connection();
  const templates = await getTemplates();
  return <NewProjectDialog templates={templates} today={todayInBogota()} />;
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
