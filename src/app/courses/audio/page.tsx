import type { Metadata } from "next";

import { CourseCatalogue } from "@/components/course-catalogue";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Audio Courses" };

export default async function AudioCoursesPage({ searchParams }: { searchParams: Promise<{ l?: string | string[] }> }) {
  await requirePortalUser();
  const query = await searchParams;
  return <CourseCatalogue medium="audio" language={query.l === "es" ? "es" : "en"} />;
}
