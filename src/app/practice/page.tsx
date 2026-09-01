import type { Metadata } from "next";

import { PracticeHome } from "@/components/practice-home";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Practice Tests" };

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ l?: string | string[] }> }) {
  await requirePortalUser();
  const query = await searchParams;
  return <PracticeHome language={query.l === "es" ? "es" : "en"} />;
}
