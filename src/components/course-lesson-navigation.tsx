"use client";

import { Check, ChevronDown, ListVideo } from "lucide-react";
import Link from "next/link";

import type { MediaSection } from "@/lib/study/types";

function LessonLinks({ currentId, hrefFor, sections }: { currentId: string; hrefFor: (id: string) => string; sections: MediaSection[] }) {
  return (
    <nav aria-label="Course lessons">
      {sections.map((section) => (
        <section key={section.id}>
          <h3>{section.title}</h3>
          {section.lessons.map((lesson) => <Link aria-current={lesson.id === currentId ? "page" : undefined} className={lesson.id === currentId ? "active" : ""} href={hrefFor(lesson.id)} key={lesson.id}><span>{lesson.watched ? <Check aria-hidden="true" /> : null}</span><strong>{lesson.title}</strong></Link>)}
        </section>
      ))}
    </nav>
  );
}

export function CourseLessonNavigation({ currentId, hrefFor, sections }: { currentId: string; hrefFor: (id: string) => string; sections: MediaSection[] }) {
  if (!sections.length) return null;
  return (
    <>
      <aside className="player-lesson-sidebar">
        <header><ListVideo aria-hidden="true" /><div><p>Course outline</p><strong>All lessons</strong></div></header>
        <LessonLinks currentId={currentId} hrefFor={hrefFor} sections={sections} />
      </aside>
      <details className="player-lesson-drawer">
        <summary><ListVideo aria-hidden="true" /><span>Course lessons</span><ChevronDown aria-hidden="true" /></summary>
        <LessonLinks currentId={currentId} hrefFor={hrefFor} sections={sections} />
      </details>
    </>
  );
}
