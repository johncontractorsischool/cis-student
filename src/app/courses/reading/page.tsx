import type { Metadata } from "next";

import { ReadingEntry } from "@/components/reading-entry";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Reading Course" };

export default async function ReadingEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ l?: string | string[] }>;
}) {
  await requirePortalUser();
  const params = await searchParams;
  return <ReadingEntry language={params.l === "es" ? "es" : "en"} />;
}
