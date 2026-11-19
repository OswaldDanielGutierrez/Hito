import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ProjectBodySkeleton } from "@/components/domain/project/BodySkeleton";
import { PhasesBoard } from "@/components/domain/project/PhasesBoard";
import { getProjectData } from "@/lib/data/project";
import { todayInBogota } from "@/lib/domain/dates";

export default function ProjectPhases({ params }: PageProps<"/proyectos/[id]/fases">) {
  return (
    <Suspense fallback={<ProjectBodySkeleton />}>
      <PhasesContent params={params} />
    </Suspense>
  );
}

async function PhasesContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const data = await getProjectData(id);
  if (!data) notFound();

  return (
    <main className="mx-auto w-full max-w-[1376px] px-4 sm:px-8 py-6">
      <PhasesBoard
        projectId={data.project.id}
        phases={data.phases}
        tasks={data.tasks}
        resources={data.resources}
        today={todayInBogota()}
      />
    </main>
  );
}
