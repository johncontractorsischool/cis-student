import type { Metadata } from "next";

import { CourseCatalogue } from "@/components/course-catalogue";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Video Courses" };

export default async function VideoCoursesPage({ searchParams }: { searchParams: Promise<{ l?: string | string[] }> }) {
  await requirePortalUser();
  const query = await searchParams;
  return <CourseCatalogue medium="video" language={query.l === "es" ? "es" : "en"} />;
}
