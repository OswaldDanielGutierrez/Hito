import { z } from "zod";

export type ActionResult = { ok: true } | { ok: false; error: string };

export const fail = (error: string): ActionResult => ({ ok: false, error });

export const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Datos inválidos";

export const uuid = z.string().uuid();

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
  .refine((d) => new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d, "Fecha inválida");
