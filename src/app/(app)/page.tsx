import { z } from "zod";
import { HomeContent } from "@/components/domain/HomeContent";

const filterSchema = z.enum(["all", "development", "qa", "production", "on_hold", "delivered"]).catch("all");

const tagSchema = z.string().uuid().optional().catch(undefined);
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Home({ searchParams }: PageProps<"/">) {
  const { estado, etiqueta } = await searchParams;
  return <HomeContent filter={filterSchema.parse(first(estado))} tagId={tagSchema.parse(first(etiqueta))} />;
}
