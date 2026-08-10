import { describe, expect, it } from "vitest";

import {
  normalizeReadingCourse,
  type RawReadingPayload,
} from "./normalize";
import { findReadingChapterByContent } from "./navigation";
import type { ReadingAccess } from "./types";

const access: ReadingAccess = {
  classificationId: "42",
  isDemo: false,
  language: "en",
  title: "Law & Business",
};

const payload: RawReadingPayload = {
  reading_courses: {
    category_1: {
      id: 1,
      title: "Chapter One",
      chapters: {
        content_10: { id: 10, title: "Direct", type: "content", read: true },
        chapter_2: {
          id: 2,
          title: "Nested chapter",
          type: "chapter",
          subchapters: {
            content_11: { id: 11, title: "Chapter content", type: "content", read: true },
            subchapter_3: {
              id: 3,
              title: "Nested subchapter",
              type: "subchapter",
              contents: {
                content_12: { id: 12, title: "Deep content", type: "content", read: false },
              },
            },
          },
        },
      },
    },
    category_2: {
      id: 2,
      title: "Chapter Two",
      chapters: {
        content_20: { id: 20, title: "Finished", type: "content", read: true },
      },
    },
  },
  reading_courses_contents: [
    { id: 10, title: "Direct", title_es: "Directo", content: "<p>One</p>" },
    { id: 11, title: "Chapter content", title_es: "", content: "<p>Two</p>" },
    { id: 12, title: "Deep content", title_es: "Profundo", content: "<p>Three</p><script>alert(1)</script>" },
    { id: 20, title: "Finished", title_es: "Finalizado", content: "<p>Four</p>" },
  ],
};

describe("normalizeReadingCourse", () => {
  it("flattens content from all three nesting levels in configured order", () => {
    const course = normalizeReadingCourse(payload, access);
    expect(course.chapters[0].topics.map((topic) => topic.id)).toEqual(["10", "11", "12"]);
    expect(course.chapters[0].topics[2].contentHtml).not.toContain("script");
  });

  it("calculates outline progress by completed chapters", () => {
    const course = normalizeReadingCourse(payload, access);
    expect(course.completedChapters).toBe(1);
    expect(course.totalChapters).toBe(2);
    expect(course.progressPercent).toBe(50);
  });

  it("omits untranslated paid Spanish topics", () => {
    const course = normalizeReadingCourse(payload, { ...access, language: "es" });
    expect(course.chapters[0].topics.map((topic) => topic.id)).toEqual(["10", "12"]);
  });

  it("keeps English fallback for untranslated demo Spanish topics", () => {
    const course = normalizeReadingCourse(payload, {
      ...access,
      isDemo: true,
      language: "es",
    });
    expect(course.chapters[0].topics.map((topic) => topic.id)).toEqual(["10", "11", "12"]);
  });

  it("finds a topic and its parent chapter", () => {
    const course = normalizeReadingCourse(payload, access);
    expect(findReadingChapterByContent(course, "20")).toMatchObject({
      chapterIndex: 1,
      topicIndex: 0,
    });
  });
});
