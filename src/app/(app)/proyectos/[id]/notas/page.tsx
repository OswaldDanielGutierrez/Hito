import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { NotepadEditor } from "@/components/domain/notes/NotepadEditor";
import { ProjectBodySkeleton } from "@/components/domain/project/BodySkeleton";
import { getProjectData } from "@/lib/data/project";

export default function ProjectNotes({ params }: PageProps<"/proyectos/[id]/notas">) {
  return (
    <Suspense fallback={<ProjectBodySkeleton />}>
      <NotesContent params={params} />
    </Suspense>
  );
}

async function NotesContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const data = await getProjectData(id);
  if (!data) notFound();

  return (
    <main className="mx-auto w-full max-w-[1376px] px-4 py-5 sm:px-8 sm:py-6">
      <NotepadEditor key={data.project.id} projectId={data.project.id} initial={data.project.notepad} />
    </main>
  );
}
