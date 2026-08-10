import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ReadingReader } from "@/components/reading-reader";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Course Reader" };

export default async function ReadingReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string; contentId: string }>;
  searchParams: Promise<{ l?: string | string[] }>;
}) {
  if (!(await hasSession())) redirect("/login");
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
