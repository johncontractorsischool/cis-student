import sanitizeHtml from "sanitize-html";

import type {
  AttemptHistory,
  PracticeCategory,
  PracticeIndex,
  PracticeQuestion,
  PracticeTestDetail,
  PracticeTestList,
  PracticeTestSummary,
} from "@/lib/practice/types";
import type { StudyLanguage } from "@/lib/study/types";

type RawRecord = Record<string, unknown>;

export type RawPracticeIndexPayload = {
  classes?: RawRecord[];
  type?: string;
};

export type RawPracticeTestsPayload = {
  safetyTests?: RawRecord[];
  tests?: RawRecord[];
};

export type RawPracticeDetailPayload = {
  questions?: RawRecord[];
  test?: RawRecord;
};

type RawHistoryPayload = { attempt_history?: RawRecord[] };

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function localized(english: unknown, spanish: unknown, language: StudyLanguage): string {
  if (language === "es" && hasText(spanish)) return spanish.trim();
  return hasText(english) ? english.trim() : "";
}

function enabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function sanitizePracticeHtml(html: unknown): string {
  if (!hasText(html)) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "a", "b", "blockquote", "br", "caption", "code", "div", "em", "figure", "figcaption",
      "h1", "h2", "h3", "h4", "hr", "i", "img", "li", "ol", "p", "pre", "small", "span",
      "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul",
    ],
    allowedAttributes: {
      "*": ["class", "style", "title"],
      a: ["href", "target", "rel"],
      img: ["alt", "height", "loading", "src", "width"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowedStyles: {
      "*": {
        "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgb/i, /^transparent$/],
        color: [/^#[0-9a-f]{3,8}$/i, /^rgb/i],
        "font-size": [/^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/],
        "font-style": [/^italic$/, /^normal$/],
        "font-weight": [/^\d{3}$/, /^bold$/, /^normal$/],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        "text-decoration": [/^underline$/, /^none$/],
      },
    },
    transformTags: {
      a: (_tag, attributes) => ({
        tagName: "a",
        attribs: { ...attributes, ...(attributes.target === "_blank" ? { rel: "noopener noreferrer" } : {}) },
      }),
      img: (_tag, attributes) => ({ tagName: "img", attribs: { ...attributes, loading: "lazy" } }),
    },
  });
}

export function normalizePracticeIndex(
  payload: RawPracticeIndexPayload,
  language: StudyLanguage,
): PracticeIndex {
  const type = payload.type === "demo_test" ? "demo_test" : "practice_test";
  const categories = (payload.classes || []).map((raw) => {
    const id = raw.id;
    const testCategoryId = raw.test_category_id;
    if (id == null || testCategoryId == null) return null;
    const categoryLanguage: StudyLanguage = language === "es" && (
      type === "demo_test" || (enabled(raw.es_access) && enabled(raw.pe_es))
    ) ? "es" : "en";
    const category: PracticeCategory = {
      completedCount: Math.max(0, safeNumber(raw.completed_count)),
      expired: enabled(raw.expired),
      expirationDate: hasText(raw.expiration_date) ? raw.expiration_date.trim() : null,
      id: String(id),
      language: categoryLanguage,
      testCategoryId: String(testCategoryId),
      title: localized(raw.name, raw.name_es, categoryLanguage) || "Practice tests",
      totalCount: Math.max(0, safeNumber(raw.total_count)),
    };
    return category;
  }).filter((category): category is PracticeCategory => category !== null);
  return { categories, language, type };
}

function normalizeTest(raw: RawRecord, language: StudyLanguage): PracticeTestSummary | null {
  if (raw.id == null) return null;
  const lastScore = safeNumber(raw.last_attempt_score, -1);
  return {
    completed: enabled(raw.is_test_completed),
    id: String(raw.id),
    lastAttemptScore: lastScore < 0 ? null : lastScore,
    title: localized(raw.tital, raw.title_es, language) || "Practice exam",
  };
}

export function normalizePracticeTestList(
  payload: RawPracticeTestsPayload,
  category: PracticeCategory,
  language: StudyLanguage,
): PracticeTestList {
  const normalize = (raw: RawRecord) => normalizeTest(raw, language);
  return {
    categoryTitle: category.title,
    classId: category.id,
    language,
    safetyTests: (payload.safetyTests || []).map(normalize).filter((test): test is PracticeTestSummary => test !== null),
    testCategoryId: category.testCategoryId,
    tests: (payload.tests || []).map(normalize).filter((test): test is PracticeTestSummary => test !== null),
  };
}

function answerKey(value: unknown): "A" | "B" | "C" | "D" {
  const key = String(value || "A").toUpperCase();
  return key === "B" || key === "C" || key === "D" ? key : "A";
}

function normalizeQuestion(raw: RawRecord, language: StudyLanguage): PracticeQuestion | null {
  if (raw.id == null) return null;
  const preferSpanish = language === "es";
  const keys = ["A", "B", "C", "D"] as const;
  return {
    answers: keys.map((key, index) => ({
      html: sanitizePracticeHtml(preferSpanish ? raw[`ans${index + 1}_es`] || raw[`ans${index + 1}`] : raw[`ans${index + 1}`]),
      key,
    })),
    correctAnswer: answerKey(raw.correct),
    explanationHtml: sanitizePracticeHtml(preferSpanish ? raw.explanation_es || raw.explanation : raw.explanation),
    html: sanitizePracticeHtml(preferSpanish ? raw.ques_es || raw.ques : raw.ques),
    id: String(raw.id),
    videoExplanationId: (() => {
      const value = preferSpanish ? raw.video_explanation_es || raw.video_explanation : raw.video_explanation;
      return value == null || Number(value) <= 0 ? null : String(value);
    })(),
  };
}

function normalizeHistory(payload: RawHistoryPayload): AttemptHistory[] {
  return (payload.attempt_history || []).map((raw, index) => ({
    date: hasText(raw.date) ? raw.date.trim() : "Previous attempt",
    id: String(raw.id ?? index),
    score: safeNumber(raw.score),
  }));
}

export function normalizePracticeTestDetail(
  detail: RawPracticeDetailPayload,
  history: RawHistoryPayload,
  language: StudyLanguage,
  studentId: string,
): PracticeTestDetail {
  const test = detail.test || {};
  if (test.id == null) throw new Error("Practice test details are unavailable.");
  const questions = (detail.questions || [])
    .map((question) => normalizeQuestion(question, language))
    .filter((question): question is PracticeQuestion => question !== null);
  const marks = Math.max(1, safeNumber(test.number_of_marks, 1));
  const questionCount = questions.length || Math.max(0, safeNumber(test.number_of_question));
  const hours = Math.max(0, safeNumber(test.timing));
  return {
    attemptHistory: normalizeHistory(history),
    attemptKey: `cis:practice-attempt:${studentId}:${String(test.id)}`,
    categoryTitle: localized(
      (test.category as RawRecord | undefined)?.name,
      (test.category as RawRecord | undefined)?.name_es,
      language,
    ) || "Practice tests",
    fullScore: questionCount * marks,
    id: String(test.id),
    language,
    passingPercent: Math.max(0, Math.min(100, safeNumber(test.passing, 80))),
    questions,
    timeLimitSeconds: hours > 0 ? Math.round(hours * 60 * 60) : 12_600,
    title: localized(test.tital, test.title_es, language) || "Practice exam",
  };
}
