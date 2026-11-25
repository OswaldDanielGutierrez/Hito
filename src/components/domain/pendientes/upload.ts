import { addFileAttachment } from "@/app/(app)/pendientes/[id]/actions";
import type { ActionResult } from "@/lib/actions";
import { sanitizeFileName } from "@/lib/domain/resourceDetect";

export const MAX_FILE_MB = 25;

/** Sube el archivo a Storage desde el navegador (`{usuario}/pendientes/{pendiente}/…`) y lo registra como adjunto. */
export async function uploadTaskFile({ file, quickTaskId, userId }: { file: File; quickTaskId: string; userId: string }): Promise<ActionResult> {
  if (file.size === 0) return { ok: false, error: `«${file.name}» está vacío` };
  if (file.size > MAX_FILE_MB * 1024 * 1024) return { ok: false, error: `«${file.name}» pesa más de ${MAX_FILE_MB} MB` };

  const storagePath = `${userId}/pendientes/${quickTaskId}/${crypto.randomUUID().slice(0, 8)}-${sanitizeFileName(file.name)}`;
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("project-files")
    .upload(storagePath, file, { contentType: file.type || undefined, upsert: false });
  if (error) return { ok: false, error: `No se pudo subir «${file.name}»: ${error.message}` };

  return addFileAttachment({ quickTaskId, storagePath, name: file.name });
}
