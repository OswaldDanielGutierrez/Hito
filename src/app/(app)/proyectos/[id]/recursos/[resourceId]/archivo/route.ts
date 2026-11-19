import { NextResponse } from "next/server";
import { uuid } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

/** Redirige a una URL firmada y temporal del archivo (el bucket es privado). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; resourceId: string }> }) {
  const { id, resourceId } = await params;
  if (!uuid.safeParse(id).success || !uuid.safeParse(resourceId).success) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  const supabase = await createClient();
  const { data: resource } = await supabase
    .from("resources")
    .select("storage_path")
    .eq("id", resourceId)
    .eq("project_id", id)
    .maybeSingle();
  if (!resource?.storage_path) return new NextResponse("No encontrado", { status: 404 });

  const { data, error } = await supabase.storage.from("project-files").createSignedUrl(resource.storage_path, 60);
  if (error || !data) return new NextResponse("No se pudo abrir el archivo", { status: 500 });

  return NextResponse.redirect(data.signedUrl);
}
