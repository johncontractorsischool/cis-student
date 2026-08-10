import type { StudyLanguage } from "@/lib/study/types";

export type PracticeCategory = {
  completedCount: number;
  expired: boolean;
  expirationDate: string | null;
  id: string;
  language: StudyLanguage;
  testCategoryId: string;
  title: string;
  totalCount: number;
};

export type PracticeIndex = {
  categories: PracticeCategory[];
  language: StudyLanguage;
  type: "demo_test" | "practice_test";
};

export type PracticeTestSummary = {
  completed: boolean;
  id: string;
  lastAttemptScore: number | null;
  title: string;
};

export type PracticeTestList = {
  categoryTitle: string;
  classId: string;
  language: StudyLanguage;
  safetyTests: PracticeTestSummary[];
  testCategoryId: string;
  tests: PracticeTestSummary[];
};

export type PracticeAnswer = {
  html: string;
  key: "A" | "B" | "C" | "D";
};

export type PracticeQuestion = {
  answers: PracticeAnswer[];
  correctAnswer: PracticeAnswer["key"];
  explanationHtml: string;
  html: string;
  id: string;
  videoExplanationId: string | null;
};

export type AttemptHistory = {
  date: string;
  id: string;
  score: number;
};

export type PracticeTestDetail = {
  attemptHistory: AttemptHistory[];
  attemptKey: string;
  categoryTitle: string;
  fullScore: number;
  id: string;
  language: StudyLanguage;
  passingPercent: number;
  questions: PracticeQuestion[];
  timeLimitSeconds: number;
  title: string;
};

export type PracticeAnswerResult = {
  answer: PracticeAnswer["key"] | null;
  correct: boolean;
  question: PracticeQuestion;
};

export type PracticeResultData = {
  answers: PracticeAnswerResult[];
  categoryTitle: string;
  correctCount: number;
  incorrectCount: number;
  missedCount: number;
  passingPercent: number;
  percent: number;
  testId: string;
  title: string;
};
