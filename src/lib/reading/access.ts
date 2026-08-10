import "server-only";

import { ApiError } from "@/lib/api/errors";
import { authenticatedRequest } from "@/lib/auth/request";
import type { ReadingAccess, ReadingLanguage } from "@/lib/reading/types";

type RawClassification = Record<string, unknown> & {
  Class_code?: string;
  Class_description?: string;
  Class_description_es?: string;
  id?: number | string;
};

type RawCourse = Record<string, unknown> & {
  id?: number | string | null;
  reading_classification?: RawClassification | null;
};

type CoursesPayload = {
  active_courses?: RawCourse[];
  es_access?: unknown;
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isEnabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function getClassId(course: RawCourse): string | null {
  const id = course.reading_classification?.id;
  return id == null ? null : String(id);
}

function isDemoCourse(course: RawCourse): boolean {
  return course.id == null || course.reading_classification?.Class_code === "DEMO";
}

function makeAccess(
  course: RawCourse,
  requestedLanguage: ReadingLanguage,
  esAccess: unknown,
): ReadingAccess {
  const classification = course.reading_classification;
  const classificationId = getClassId(course);
  if (!classification || !classificationId) {
    throw new ApiError("No reading course is currently available.", 404);
  }

  const demo = isDemoCourse(course);
  const language: ReadingLanguage =
    requestedLanguage === "es" && (demo || isEnabled(esAccess)) ? "es" : "en";
  const title =
    language === "es" && hasText(classification.Class_description_es)
      ? classification.Class_description_es.trim()
      : classification.Class_description?.trim() || "Reading Course";

  return { classificationId, isDemo: demo, language, title };
}

async function getCourseAccessPayload(): Promise<CoursesPayload> {
  return authenticatedRequest<CoursesPayload>("/courses/reading");
}

export async function resolveReadingEntry(
  requestedLanguage: ReadingLanguage,
): Promise<ReadingAccess> {
  const payload = await getCourseAccessPayload();
  const courses = (payload.active_courses || []).filter((course) => getClassId(course));
  const selected = courses.find((course) => !isDemoCourse(course)) || courses[0];
  if (!selected) throw new ApiError("No reading course is currently available.", 404);
  return makeAccess(selected, requestedLanguage, payload.es_access);
}

export async function verifyReadingAccess(
  classificationId: string,
  requestedLanguage: ReadingLanguage,
): Promise<ReadingAccess> {
  const payload = await getCourseAccessPayload();
  const selected = (payload.active_courses || []).find(
    (course) => getClassId(course) === classificationId,
  );
  if (!selected) {
    throw new ApiError("You do not have access to this reading course.", 403);
  }
  return makeAccess(selected, requestedLanguage, payload.es_access);
}
