"use client";

import { ArrowLeft, Check, ChevronRight, Headphones, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { AudioCourse, CourseMedium, MediaCourse, StudyLanguage } from "@/lib/study/types";

export function MediaCourseList({ classId, language, medium }: { classId: string; language: StudyLanguage; medium: CourseMedium }) {
  const router = useRouter();
  const [course, setCourse] = useState<MediaCourse | AudioCourse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/${medium === "video" ? "videos" : "audio"}/${encodeURIComponent(classId)}${language === "es" ? "?l=es" : ""}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { data?: MediaCourse | AudioCourse; error?: { message?: string } };
        if (response.status === 401) return router.replace("/login");
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load this course.");
        setCourse(payload.data);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load this course.");
      }
    }
    void load();
    return () => controller.abort();
  }, [classId, language, medium, router]);

  const Icon = medium === "video" ? PlayCircle : Headphones;
  const label = medium === "video" ? "Video course" : "Audio course";
  if (error) return <main className="centered-state"><h1>{label} unavailable</h1><p>{error}</p><Link className="primary-button reading-link-button" href={`/courses/${medium}`}>Choose another course</Link></main>;
  if (!course) return <main className="reading-entry-state" aria-busy="true"><span className="reading-loader" /><h1>Loading your {label.toLowerCase()}</h1><p>Preparing your lessons and progress…</p></main>;

  const percent = course.totalCount ? Math.round((course.completedCount / course.totalCount) * 100) : 0;
  const languageQuery = course.language === "es" ? "?l=es" : "";
  return (
    <div className="study-page">
      <header className="study-topbar"><Link href={`/courses/${medium}${languageQuery}`} aria-label={`Back to ${label}`}><ArrowLeft aria-hidden="true" /></Link><div><span>{label}</span><strong>{course.title}</strong></div><span className="reading-language-badge">{course.language.toUpperCase()}</span></header>
      <main className="study-main media-course-main">
        <section className="media-course-hero"><span><Icon aria-hidden="true" /></span><div><p>Your {label}</p><h1>{course.title}</h1><small>{course.completedCount} of {course.totalCount} lessons complete</small></div><strong>{percent}%</strong><div className="media-progress"><i style={{ width: `${percent}%` }} /></div></section>
        {course.redirectUrl ? <p className="media-help">Having trouble with a lesson? <a href={course.redirectUrl} target="_blank" rel="noreferrer">Open the web course fallback</a>.</p> : null}
        <section className="media-outline" aria-label={`${label} lessons`}>
          {course.sections.map((section, index) => (
            <details key={section.id} open={index === 0}>
              <summary><span>{section.title}</span><small>{section.lessons.length} lessons</small></summary>
              <ol>
                {section.lessons.map((lesson, lessonIndex) => {
                  const href = medium === "video"
                    ? `/videos/watch/${lesson.id}${languageQuery}`
                    : `/audio/${classId}/${lesson.id}${languageQuery}`;
                  return <li key={lesson.id}><Link href={href}><span className={lesson.watched ? "watched" : ""}>{lesson.watched ? <Check aria-hidden="true" /> : lessonIndex + 1}</span><div><strong>{lesson.title}</strong><small>{lesson.watched ? "Complete" : medium === "video" ? "Watch lesson" : "Listen to lesson"}</small></div><ChevronRight aria-hidden="true" /></Link></li>;
                })}
              </ol>
            </details>
          ))}
          {!course.sections.length ? <div className="study-empty-card embedded"><Icon aria-hidden="true" /><h2>No lessons available</h2><p>This course does not currently contain any playable lessons.</p></div> : null}
        </section>
      </main>
    </div>
  );
}
