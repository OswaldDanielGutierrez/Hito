import { addFileResource } from "@/app/(app)/proyectos/[id]/recursos/actions";
import type { ActionResult } from "@/lib/actions";
import { sanitizeFileName } from "@/lib/domain/resourceDetect";
import { createClient } from "@/lib/supabase/client";

export const MAX_FILE_MB = 25;

/** Sube el archivo a Storage desde el navegador (ruta `{usuario}/{proyecto}/…`) y registra el recurso. */
export async function uploadProjectFile({
  file,
  projectId,
  userId,
  phaseId,
}: {
  file: File;
  projectId: string;
  userId: string;
  phaseId: string | null;
}): Promise<ActionResult> {
  if (file.size === 0) return { ok: false, error: `«${file.name}» está vacío` };
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return { ok: false, error: `«${file.name}» pesa más de ${MAX_FILE_MB} MB` };
  }

  const storagePath = `${userId}/${projectId}/${crypto.randomUUID().slice(0, 8)}-${sanitizeFileName(file.name)}`;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("project-files")
    .upload(storagePath, file, { contentType: file.type || undefined, upsert: false });
  if (error) return { ok: false, error: `No se pudo subir «${file.name}»: ${error.message}` };

  return addFileResource({ projectId, storagePath, name: file.name, phaseId });
}
