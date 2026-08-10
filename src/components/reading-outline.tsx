"use client";

import { ArrowLeft, BookOpen, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ReadingCourse, ReadingLanguage } from "@/lib/reading/types";

export function ReadingOutline({
  classId,
  language,
}: {
  classId: string;
  language: ReadingLanguage;
}) {
  const router = useRouter();
  const [course, setCourse] = useState<ReadingCourse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadCourse() {
      try {
        const response = await fetch(`/api/reading/${encodeURIComponent(classId)}?l=${language}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          data?: ReadingCourse;
          error?: { message?: string };
        };
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "Unable to load this reading course.");
        }
        setCourse(payload.data);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load this reading course.");
        }
      }
    }
    void loadCourse();
    return () => controller.abort();
  }, [classId, language, router]);

  if (error) {
    return (
      <main className="centered-state">
        <h1>We couldn’t load this course</h1>
        <p>{error}</p>
        <Link className="primary-button reading-link-button" href="/dashboard">Back to dashboard</Link>
      </main>
    );
  }

  if (!course) return <ReadingPageSkeleton />;

  const languageQuery = course.language === "es" ? "?l=es" : "";

  return (
    <div className="reading-page">
      <header className="reading-topbar">
        <Link href="/dashboard" aria-label="Back to dashboard"><ArrowLeft aria-hidden="true" /></Link>
        <div>
          <span>{course.language === "es" ? "Curso de lectura" : "Reading course"}</span>
          <strong>{course.title}</strong>
        </div>
        <span className="reading-language-badge">{course.language.toUpperCase()}</span>
      </header>

      <main className="reading-outline-main">
        <section className="reading-course-hero">
          <div className="reading-course-icon"><BookOpen aria-hidden="true" /></div>
          <div className="reading-course-title">
            <p>{course.isDemo ? "Demo reading course" : "Your reading course"}</p>
            <h1>{course.title}</h1>
          </div>
          <div className="reading-hero-progress" aria-label={`${course.progressPercent}% complete`}>
            <strong>{course.progressPercent}%</strong>
            <span>complete</span>
          </div>
          <div className="reading-progress-track"><span style={{ width: `${course.progressPercent}%` }} /></div>
        </section>

        <section className="reading-stats" aria-label="Course progress summary">
          <div><strong>{course.totalChapters}</strong><span>Total chapters</span></div>
          <div><strong>{course.completedChapters}</strong><span>Completed</span></div>
          <div><strong>{course.remainingChapters}</strong><span>Remaining</span></div>
        </section>

        <section className="reading-outline" aria-labelledby="course-outline-title">
          <div className="reading-outline-heading">
            <div>
              <p>Course content</p>
              <h2 id="course-outline-title">Chapter outline</h2>
            </div>
            <span>{course.totalChapters} chapters</span>
          </div>

          {course.chapters.length ? (
            <ol className="reading-chapter-list">
              {course.chapters.map((chapter, index) => (
                <li className={chapter.complete ? "complete" : ""} key={chapter.id}>
                  <Link
                    className="reading-chapter-link"
                    href={`/reading/${course.classificationId}/${chapter.topics[0].id}${languageQuery}`}
                  >
                    <span className="reading-chapter-number">{chapter.complete ? <Check aria-hidden="true" /> : index + 1}</span>
                    <div className="reading-chapter-copy">
                      <h3>{chapter.title}</h3>
                      <p>{chapter.topics.length} {chapter.topics.length === 1 ? "topic" : "topics"}</p>
                    </div>
                    {chapter.complete ? (
                      <span className="reading-complete-pill"><Check aria-hidden="true" />Complete</span>
                    ) : (
                      <span className="reading-start-link">
                      Start <ChevronRight aria-hidden="true" />
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <div className="reading-empty-state">
              <BookOpen aria-hidden="true" />
              <h3>No readable chapters are available</h3>
              <p>Try switching to English or contact support if this looks incorrect.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ReadingPageSkeleton() {
  return (
    <div className="reading-page" aria-busy="true" aria-label="Loading reading course">
      <header className="reading-topbar"><span /><strong>Reading course</strong><span /></header>
      <main className="reading-outline-main skeleton-page">
        <div className="skeleton reading-hero-skeleton" />
        <div className="skeleton reading-stats-skeleton" />
        <div className="skeleton reading-list-skeleton" />
      </main>
    </div>
  );
}
