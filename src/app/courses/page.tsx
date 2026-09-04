import type { Metadata } from "next";
import { BookOpen, Headphones, PlayCircle, Radio, ChevronRight } from "lucide-react";
import Link from "next/link";

import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Courses" };

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ l?: string | string[] }> }) {
  await requirePortalUser();
  const query = await searchParams;
  const suffix = query.l === "es" ? "?l=es" : "";
  const courses = [
    { description: "Watch guided lessons and track your progress.", href: `/courses/video${suffix}`, icon: PlayCircle, title: "Video Course" },
    { description: "Read continuously through every chapter and topic.", href: `/courses/reading${suffix}`, icon: BookOpen, title: "Reading Course" },
    { description: "Study hands-free with the complete audio library.", href: `/courses/audio${suffix}`, icon: Headphones, title: "Audio Course" },
    { description: "Join live instruction or watch available class recordings.", href: `/live${suffix}`, icon: Radio, title: "Live Class" },
  ];

  return (
    <main className="courses-hub">
      <header>
        <p>Study library</p>
        <h1>Courses</h1>
        <span>Choose the format that fits how you want to study today.</span>
      </header>
      <section aria-label="Course formats">
        {courses.map((course) => {
          const Icon = course.icon;
          return <Link href={course.href} key={course.href}><span><Icon aria-hidden="true" /></span><div><h2>{course.title}</h2><p>{course.description}</p></div><ChevronRight aria-hidden="true" /></Link>;
        })}
      </section>
    </main>
  );
}
