import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface TemplateData {
  id: string;
  name: string;
  isSystem: boolean;
  phases: { name: string; offset_days: number }[];
}

const phasesSchema = z.array(z.object({ name: z.string(), offset_days: z.number().int().min(0) }));

/** Plantillas del sistema primero, luego las propias. */
export async function getTemplates(): Promise<TemplateData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("phase_templates").select("id, name, owner_id, phases");
  if (error) throw new Error(error.message);

  return (data ?? [])
    .flatMap((t) => {
      const phases = phasesSchema.safeParse(t.phases);
      return phases.success ? [{ id: t.id, name: t.name, isSystem: t.owner_id === null, phases: phases.data }] : [];
    })
    .sort((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name, "es"));
}
