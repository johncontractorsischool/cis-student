import type { Metadata } from "next";

import { MediaCourseList } from "@/components/media-course-list";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Audio Course" };

export default async function AudioCoursePage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ l?: string | string[] }> }) {
  await requirePortalUser();
  const [{ classId }, query] = await Promise.all([params, searchParams]);
  return <MediaCourseList classId={classId} language={query.l === "es" ? "es" : "en"} medium="audio" />;
}
