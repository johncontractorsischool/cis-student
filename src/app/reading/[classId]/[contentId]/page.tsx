import type { Metadata } from "next";

import { ReadingReader } from "@/components/reading-reader";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Course Reader" };

export default async function ReadingReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string; contentId: string }>;
  searchParams: Promise<{ l?: string | string[] }>;
}) {
  await requirePortalUser();
  const { classId, contentId } = await params;
  const query = await searchParams;
  return (
    <ReadingReader
      classId={classId}
      contentId={contentId}
      language={query.l === "es" ? "es" : "en"}
    />
  );
}
