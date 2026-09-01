import type { Metadata } from "next";

import { ReadingOutline } from "@/components/reading-outline";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Reading Course" };

export default async function ReadingOutlinePage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ l?: string | string[] }>;
}) {
  await requirePortalUser();
  const { classId } = await params;
  const query = await searchParams;
  return <ReadingOutline classId={classId} language={query.l === "es" ? "es" : "en"} />;
}
