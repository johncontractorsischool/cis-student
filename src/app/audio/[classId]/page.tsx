import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MediaCourseList } from "@/components/media-course-list";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Audio Course" };

export default async function AudioCoursePage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ l?: string | string[] }> }) {
  if (!(await hasSession())) redirect("/login");
  const [{ classId }, query] = await Promise.all([params, searchParams]);
  return <MediaCourseList classId={classId} language={query.l === "es" ? "es" : "en"} medium="audio" />;
}
