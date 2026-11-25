import { NextResponse } from "next/server";
import { uuid } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";

/** Redirige a una URL firmada y temporal del archivo adjunto (el bucket es privado). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const { id, attachmentId } = await params;
  if (!uuid.safeParse(id).success || !uuid.safeParse(attachmentId).success) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  const supabase = await createClient();
  const { data: attachment } = await supabase
    .from("quick_task_attachments")
    .select("storage_path")
    .eq("id", attachmentId)
    .eq("quick_task_id", id)
    .maybeSingle();
  if (!attachment?.storage_path) return new NextResponse("No encontrado", { status: 404 });

  const { data, error } = await supabase.storage.from("project-files").createSignedUrl(attachment.storage_path, 60);
  if (error || !data) return new NextResponse("No se pudo abrir el archivo", { status: 500 });

  return NextResponse.redirect(data.signedUrl);
}
