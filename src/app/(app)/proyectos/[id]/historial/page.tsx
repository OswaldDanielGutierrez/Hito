import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { HistoryView } from "@/components/domain/history/HistoryView";
import { ProjectBodySkeleton } from "@/components/domain/project/BodySkeleton";
import { getProjectData, getProjectHistory } from "@/lib/data/project";

export default function ProjectHistory({ params }: PageProps<"/proyectos/[id]/historial">) {
  return (
    <Suspense fallback={<ProjectBodySkeleton />}>
      <HistoryContent params={params} />
    </Suspense>
  );
}

async function HistoryContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const [data, history] = await Promise.all([getProjectData(id), getProjectHistory(id)]);
  if (!data) notFound();

  return (
    <main className="mx-auto w-full max-w-[1376px] px-4 py-5 sm:px-8 sm:py-6">
      <HistoryView
        projectId={data.project.id}
        entries={history.entries}
        rules={history.rules}
        notifyInApp={history.notifyInApp}
        notifyEmail={history.notifyEmail}
      />
    </main>
  );
}
