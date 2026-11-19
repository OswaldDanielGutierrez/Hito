import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ProjectHeader, ProjectHeaderSkeleton } from "@/components/domain/project/ProjectHeader";
import { getProjectData } from "@/lib/data/project";
import { todayInBogota } from "@/lib/domain/dates";

async function ProjectHeaderLoader({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const data = await getProjectData(id);
  if (!data) notFound();
  return <ProjectHeader data={data} today={todayInBogota()} />;
}

export default function ProjectLayout({ children, params }: LayoutProps<"/proyectos/[id]">) {
  return (
    <>
      <Suspense fallback={<ProjectHeaderSkeleton />}>
        <ProjectHeaderLoader params={params} />
      </Suspense>
      {children}
    </>
  );
}
