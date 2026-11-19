import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ActionResult = { ok: true } | { ok: false; error: string };

export const fail = (error: string): ActionResult => ({ ok: false, error });

export const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Datos inválidos";

export const uuid = z.string().uuid();

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
  .refine((d) => new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d, "Fecha inválida");

/** Revalida las pantallas que muestran datos de proyectos. */
export function refreshProjectViews() {
  revalidatePath("/proyectos/[id]", "layout");
  revalidatePath("/");
  revalidatePath("/archivados");
}

/** Ejecuta una acción, captura errores y revalida solo si salió bien. */
export async function runAction(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    const result = await fn();
    if (result.ok) refreshProjectViews();
    return result;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "No se pudo guardar el cambio");
  }
}
