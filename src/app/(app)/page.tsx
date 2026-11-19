import { z } from "zod";
import { HomeContent } from "@/components/domain/HomeContent";

const filterSchema = z.enum(["all", "development", "qa", "production", "on_hold", "delivered"]).catch("all");

export default async function Home({ searchParams }: PageProps<"/">) {
  const { estado } = await searchParams;
  return <HomeContent filter={filterSchema.parse(Array.isArray(estado) ? estado[0] : estado)} />;
}
