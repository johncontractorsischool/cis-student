"use client";

import { ArrowLeft, ChevronRight, Headphones, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { CourseMedium, StudyCourseCatalogue, StudyCourseOption, StudyLanguage } from "@/lib/study/types";

function courseHref(course: StudyCourseOption): string {
  const root = course.medium === "video" ? "/videos" : "/audio";
  return `${root}/${course.classificationId}${course.language === "es" ? "?l=es" : ""}`;
}

export function CourseCatalogue({ medium, language }: { medium: CourseMedium; language: StudyLanguage }) {
  const router = useRouter();
  const [data, setData] = useState<StudyCourseCatalogue | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/courses/${medium}${language === "es" ? "?l=es" : ""}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as { data?: StudyCourseCatalogue; error?: { message?: string } };
        if (response.status === 401) return router.replace("/login");
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load your courses.");
        const onlyCourse = payload.data.activeCourses.length === 1 ? payload.data.activeCourses[0] : null;
        if (onlyCourse?.isDemo) return router.replace(courseHref(onlyCourse));
        setData(payload.data);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load your courses.");
      }
    }
    void load();
    return () => controller.abort();
  }, [language, medium, router]);

  const title = medium === "video" ? "Video courses" : "Audio courses";
  const Icon = medium === "video" ? PlayCircle : Headphones;
  if (error) return <CourseError title={`${title} unavailable`} message={error} />;
  if (!data) return <CourseLoading title={title} />;

  return (
    <div className="study-page">
      <header className="study-topbar">
        <Link href="/dashboard" aria-label="Back to dashboard"><ArrowLeft aria-hidden="true" /></Link>
        <div><span>Study library</span><strong>{title}</strong></div>
        <span className="reading-language-badge">{language.toUpperCase()}</span>
      </header>
      <main className="study-main">
        <section className="study-page-heading">
          <span><Icon aria-hidden="true" /></span>
          <div><p>Your courses</p><h1>{title}</h1><span>Choose an active classification to continue.</span></div>
        </section>

        {data.activeCourses.length ? (
          <section className="course-catalogue" aria-labelledby="active-course-title">
            <div className="course-section-heading"><div><p>Available now</p><h2 id="active-course-title">Active courses</h2></div><span>{data.activeCourses.length}</span></div>
            <div className="course-option-list">
              {data.activeCourses.map((course) => {
                const percent = course.totalCount ? Math.round((course.completedCount / course.totalCount) * 100) : 0;
                return (
                  <Link href={courseHref(course)} className="course-option" key={course.classificationId}>
                    <span className="course-option-icon"><Icon aria-hidden="true" /></span>
                    <div><h3>{course.title}</h3><p>{course.totalCount ? `${course.completedCount} of ${course.totalCount} complete` : "Ready to begin"}</p><span className="course-option-progress"><i style={{ width: `${percent}%` }} /></span></div>
                    <strong>{percent}%</strong><ChevronRight aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="study-empty-card"><Icon aria-hidden="true" /><h2>No active courses</h2><p>{data.message || `You do not currently have an active ${medium} course.`}</p><a href="https://www.contractorsischool.com/contractors-license-exam" target="_blank" rel="noreferrer">View course options</a></section>
        )}

        {data.expiredCourses.length ? (
          <section className="expired-course-section"><h2>Expired courses</h2>{data.expiredCourses.map((course) => <div key={course.classificationId}><span>{course.title}</span><small>Expired {course.endDate || ""}</small><a href="https://www.contractorsischool.com/contractors-license-exam" target="_blank" rel="noreferrer">Renew</a></div>)}</section>
        ) : null}
      </main>
    </div>
  );
}

function CourseLoading({ title }: { title: string }) {
  return <main className="reading-entry-state" aria-busy="true"><span className="reading-loader" /><h1>Loading {title.toLowerCase()}</h1><p>Checking your active classifications…</p></main>;
}

function CourseError({ message, title }: { message: string; title: string }) {
  return <main className="centered-state"><h1>{title}</h1><p>{message}</p><Link className="primary-button reading-link-button" href="/dashboard">Back to dashboard</Link></main>;
}
