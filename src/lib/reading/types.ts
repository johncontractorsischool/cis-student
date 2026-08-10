export type ReadingLanguage = "en" | "es";

export type ReadingTopic = {
  contentHtml: string;
  id: string;
  read: boolean;
  title: string;
};

export type ReadingChapter = {
  complete: boolean;
  id: string;
  title: string;
  topics: ReadingTopic[];
};

export type ReadingCourse = {
  chapters: ReadingChapter[];
  classificationId: string;
  completedChapters: number;
  isDemo: boolean;
  language: ReadingLanguage;
  progressPercent: number;
  remainingChapters: number;
  title: string;
  totalChapters: number;
};

export type ReadingAccess = {
  classificationId: string;
  isDemo: boolean;
  language: ReadingLanguage;
  title: string;
};
