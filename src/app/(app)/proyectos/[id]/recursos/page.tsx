import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ProjectBodySkeleton } from "@/components/domain/project/BodySkeleton";
import { ResourcesBoard } from "@/components/domain/resources/ResourcesBoard";
import { getProjectData, getProjectExtras } from "@/lib/data/project";
import { createClient } from "@/lib/supabase/server";

export default function ProjectResources({ params }: PageProps<"/proyectos/[id]/recursos">) {
  return (
    <Suspense fallback={<ProjectBodySkeleton />}>
      <ResourcesContent params={params} />
    </Suspense>
  );
}

async function ResourcesContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const [data, extras, userResult] = await Promise.all([getProjectData(id), getProjectExtras(id), supabase.auth.getUser()]);
  const user = userResult.data.user;
  if (!data || !user) notFound();

  return (
    <main className="mx-auto w-full max-w-[1376px] px-4 py-5 sm:px-8 sm:py-6">
      <ResourcesBoard
        projectId={data.project.id}
        userId={user.id}
        phases={data.phases.map((p) => ({ id: p.id, name: p.name }))}
        resources={data.resources}
        notes={extras.notes}
        contacts={extras.contacts}
      />
    </main>
  );
}
