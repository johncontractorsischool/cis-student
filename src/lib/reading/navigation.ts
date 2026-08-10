import type { ReadingChapter, ReadingCourse } from "@/lib/reading/types";

export function findReadingChapterByContent(
  course: ReadingCourse,
  contentId: string,
): { chapter: ReadingChapter; chapterIndex: number; topicIndex: number } | null {
  for (let chapterIndex = 0; chapterIndex < course.chapters.length; chapterIndex += 1) {
    const chapter = course.chapters[chapterIndex];
    const topicIndex = chapter.topics.findIndex((topic) => topic.id === contentId);
    if (topicIndex >= 0) return { chapter, chapterIndex, topicIndex };
  }
  return null;
}
