import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CourseCatalogue } from "@/components/course-catalogue";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Audio Courses" };

export default async function AudioCoursesPage({ searchParams }: { searchParams: Promise<{ l?: string | string[] }> }) {
  if (!(await hasSession())) redirect("/login");
  const query = await searchParams;
  return <CourseCatalogue medium="audio" language={query.l === "es" ? "es" : "en"} />;
}
