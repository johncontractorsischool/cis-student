"use client";

import { ArrowLeft, Check, ChevronRight, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { findReadingChapterByContent } from "@/lib/reading/navigation";
import type { ReadingCourse, ReadingLanguage } from "@/lib/reading/types";

export function ReadingReader({
  classId,
  contentId,
  language,
}: {
  classId: string;
  contentId: string;
  language: ReadingLanguage;
}) {
  const router = useRouter();
  const [course, setCourse] = useState<ReadingCourse | null>(null);
  const [error, setError] = useState("");
  const [progressError, setProgressError] = useState("");
  const [activeTopicId, setActiveTopicId] = useState(contentId);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [fontSize, setFontSize] = useState(17);
  const chapterRefs = useRef(new Map<string, HTMLElement>());
  const contentRefs = useRef(new Map<string, HTMLElement>());
  const topicRefs = useRef(new Map<string, HTMLAnchorElement>());
  const pendingIds = useRef(new Set<string>());
  const seenChapterIds = useRef(new Set<string>());
  const initialScrollComplete = useRef(false);

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
        setCompletedIds(new Set(
          payload.data.chapters.flatMap((chapter) =>
            chapter.topics.filter((topic) => topic.read).map((topic) => topic.id),
          ),
        ));
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load this reading course.");
        }
      }
    }
    void loadCourse();
    return () => controller.abort();
  }, [classId, language, router]);

  const location = useMemo(
    () => course ? findReadingChapterByContent(course, contentId) : null,
    [contentId, course],
  );
  const allTopics = useMemo(
    () => course?.chapters.flatMap((chapter) => chapter.topics) || [],
    [course],
  );
  const activeLocation = useMemo(
    () => course ? findReadingChapterByContent(course, activeTopicId) : null,
    [activeTopicId, course],
  );
  const activeChapter = activeLocation?.chapter || location?.chapter;
  const languageQuery = course?.language === "es" ? "?l=es" : "";

  const markComplete = useCallback(async (ids: string[]) => {
    const pending = ids.filter(
      (id) => !completedIds.has(id) && !pendingIds.current.has(id),
    );
    if (!pending.length) return;

    pending.forEach((id) => pendingIds.current.add(id));
    setProgressError("");
    try {
      const response = await fetch(
        `/api/reading/${encodeURIComponent(classId)}/progress?l=${language}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentIds: pending }),
        },
      );
      const payload = (await response.json()) as {
        data?: { completedIds?: string[] };
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(payload.error?.message || "Unable to save reading progress.");
      }
      const saved = payload.data?.completedIds || pending;
      setCompletedIds((current) => new Set([...current, ...saved]));
    } catch (saveError) {
      setProgressError(saveError instanceof Error ? saveError.message : "Unable to save reading progress.");
    } finally {
      pending.forEach((id) => pendingIds.current.delete(id));
    }
  }, [classId, completedIds, language]);

  useEffect(() => {
    if (!course || !location || initialScrollComplete.current) return;
    const frame = window.requestAnimationFrame(() => {
      contentRefs.current.get(contentId)?.scrollIntoView({ block: "start" });
      initialScrollComplete.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [contentId, course, location]);

  useEffect(() => {
    if (!course) return;
    const observedCourse = course;
    let ticking = false;

    function followScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const activationLine = window.innerHeight * 0.34;
        const readingLine = window.innerHeight * 0.82;
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 12;
        let currentTopic: string | undefined = allTopics[0]?.id;

        for (const chapter of observedCourse.chapters) {
          const chapterElement = chapterRefs.current.get(chapter.id);
          if (!chapterElement) continue;
          const chapterRect = chapterElement.getBoundingClientRect();

          if (chapterRect.top < readingLine && chapterRect.bottom > 0) {
            seenChapterIds.current.add(chapter.id);
          }

          if (
            seenChapterIds.current.has(chapter.id) &&
            (chapterRect.bottom < activationLine || (atBottom && chapter === observedCourse.chapters.at(-1)))
          ) {
            void markComplete(chapter.topics.map((topic) => topic.id));
          }
        }

        for (const topic of allTopics) {
          const element = contentRefs.current.get(topic.id);
          if (element && element.getBoundingClientRect().top <= activationLine) {
            currentTopic = topic.id;
          }
        }
        if (atBottom) currentTopic = allTopics.at(-1)?.id;
        if (currentTopic) setActiveTopicId(currentTopic);
        ticking = false;
      });
    }

    followScroll();
    window.addEventListener("scroll", followScroll, { passive: true });
    window.addEventListener("resize", followScroll);
    return () => {
      window.removeEventListener("scroll", followScroll);
      window.removeEventListener("resize", followScroll);
    };
  }, [allTopics, course, markComplete]);

  useEffect(() => {
    topicRefs.current.get(activeTopicId)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeTopicId]);

  if (error) {
    return (
      <main className="centered-state">
        <h1>We couldn’t open this reading course</h1>
        <p>{error}</p>
        <Link className="primary-button reading-link-button" href={`/reading/${classId}`}>Back to course</Link>
      </main>
    );
  }

  if (!course) return <ReadingPageSkeleton />;

  if (!location || !activeChapter) {
    return (
      <main className="centered-state">
        <h1>Reading section not found</h1>
        <p>This section is not part of the selected course or language.</p>
        <Link className="primary-button reading-link-button" href={`/reading/${classId}${languageQuery}`}>Back to course</Link>
      </main>
    );
  }

  const completedChapters = course.chapters.filter((chapter) =>
    chapter.topics.every((topic) => completedIds.has(topic.id)),
  ).length;
  const coursePercent = course.totalChapters
    ? Math.round((completedChapters / course.totalChapters) * 100)
    : 0;

  return (
    <div className="reader-page">
      <header className="reader-topbar">
        <Link href={`/reading/${classId}${languageQuery}`} aria-label="Back to course outline"><ArrowLeft aria-hidden="true" /></Link>
        <div>
          <span>{course.title}</span>
          <strong>{activeChapter.title}</strong>
        </div>
        <div className="reader-font-controls" aria-label="Reading text size">
          <button onClick={() => setFontSize((value) => Math.max(14, value - 1))} aria-label="Decrease text size"><Minus aria-hidden="true" /></button>
          <span>Aa</span>
          <button onClick={() => setFontSize((value) => Math.min(24, value + 1))} aria-label="Increase text size"><Plus aria-hidden="true" /></button>
        </div>
      </header>

      <div className="reader-progress-bar" aria-label={`${coursePercent}% of course complete`}>
        <span style={{ width: `${coursePercent}%` }} />
      </div>

      <main className="reader-layout reader-continuous-layout">
        <aside className="topic-rail topic-rail-course" aria-label="Course chapters and topics">
          <div className="topic-rail-heading">
            <span>Course outline</span>
            <strong>{completedChapters}/{course.totalChapters}</strong>
          </div>
          <nav>
            {course.chapters.map((chapter, chapterIndex) => {
              const chapterComplete = chapter.topics.every((topic) => completedIds.has(topic.id));
              return (
                <section className="topic-rail-chapter" key={chapter.id}>
                  <button
                    className={activeChapter.id === chapter.id ? "active" : ""}
                    onClick={() => chapterRefs.current.get(chapter.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    <span>{chapterComplete ? <Check aria-hidden="true" /> : chapterIndex + 1}</span>
                    <strong>{chapter.title}</strong>
                  </button>
                  {chapter.topics.map((topic, topicIndex) => (
                    <a
                      className={`${activeTopicId === topic.id ? "active" : ""} ${completedIds.has(topic.id) ? "complete" : ""}`}
                      href={`#topic-${topic.id}`}
                      key={topic.id}
                      ref={(element) => {
                        if (element) topicRefs.current.set(topic.id, element);
                        else topicRefs.current.delete(topic.id);
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        contentRefs.current.get(topic.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      <span>{completedIds.has(topic.id) ? <Check aria-hidden="true" /> : topicIndex + 1}</span>
                      <strong>{topic.title}</strong>
                    </a>
                  ))}
                </section>
              );
            })}
          </nav>
        </aside>

        <div className="reader-content-column reader-course-stream" style={{ "--reader-font-size": `${fontSize}px` } as React.CSSProperties}>
          <header className="reader-stream-heading">
            <p>Continuous reading</p>
            <h1>{course.title}</h1>
            <span>Keep scrolling to move through every chapter. A chapter is marked complete after you pass its end.</span>
          </header>

          {progressError ? <p className="reader-progress-error" role="alert">{progressError}</p> : null}

          {course.chapters.map((chapter, chapterIndex) => {
            const completedInChapter = chapter.topics.filter((topic) => completedIds.has(topic.id)).length;
            const chapterPercent = Math.round((completedInChapter / chapter.topics.length) * 100);
            const chapterComplete = completedInChapter === chapter.topics.length;
            return (
              <section
                className="reader-chapter-section"
                data-chapter-id={chapter.id}
                id={`chapter-${chapter.id}`}
                key={chapter.id}
                ref={(element) => {
                  if (element) chapterRefs.current.set(chapter.id, element);
                  else chapterRefs.current.delete(chapter.id);
                }}
              >
                <header className="reader-chapter-heading">
                  <p>Chapter {chapterIndex + 1} of {course.totalChapters}</p>
                  <h1>{chapter.title}</h1>
                  <div><span style={{ width: `${chapterPercent}%` }} /></div>
                  <small>{chapterComplete ? "Chapter complete" : `${chapterPercent}% complete`}</small>
                </header>

                <div className="reader-card-stream">
                  {chapter.topics.map((topic, topicIndex) => (
                    <article
                      className={`${activeTopicId === topic.id ? "active" : ""} ${completedIds.has(topic.id) ? "complete" : ""}`}
                      data-topic-id={topic.id}
                      id={`topic-${topic.id}`}
                      key={topic.id}
                      ref={(element) => {
                        if (element) contentRefs.current.set(topic.id, element);
                        else contentRefs.current.delete(topic.id);
                      }}
                    >
                      <header>
                        <span>Topic {topicIndex + 1}</span>
                        {completedIds.has(topic.id) ? <span className="reader-read-state"><Check aria-hidden="true" />Read</span> : null}
                      </header>
                      <h2>{topic.title}</h2>
                      <div className="trusted-reading-html" dangerouslySetInnerHTML={{ __html: topic.contentHtml }} />
                    </article>
                  ))}
                </div>

                <div className={`reader-chapter-passed ${chapterComplete ? "complete" : ""}`}>
                  {chapterComplete ? <Check aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
                  <span>
                    <strong>{chapterComplete ? "Chapter complete" : "Continue to the next chapter"}</strong>
                    <small>{chapterIndex < course.totalChapters - 1 ? course.chapters[chapterIndex + 1].title : "You’ve reached the end of the course"}</small>
                  </span>
                </div>
              </section>
            );
          })}

          <div className="reader-course-finish">
            <Check aria-hidden="true" />
            <h2>You’ve reached the end</h2>
            <p>Your final chapter is saved when this section comes into view.</p>
            <Link href={`/reading/${classId}${languageQuery}`}>Return to course outline <ChevronRight aria-hidden="true" /></Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReadingPageSkeleton() {
  return (
    <div className="reader-page" aria-busy="true" aria-label="Loading reading course">
      <header className="reader-topbar"><span /><strong>Reading course</strong><span /></header>
      <main className="reader-layout skeleton-page">
        <div className="skeleton reader-rail-skeleton" />
        <div className="skeleton reader-content-skeleton" />
      </main>
    </div>
  );
}
