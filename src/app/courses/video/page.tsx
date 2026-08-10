import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CourseCatalogue } from "@/components/course-catalogue";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Video Courses" };

export default async function VideoCoursesPage({ searchParams }: { searchParams: Promise<{ l?: string | string[] }> }) {
  if (!(await hasSession())) redirect("/login");
  const query = await searchParams;
  return <CourseCatalogue medium="video" language={query.l === "es" ? "es" : "en"} />;
}
