import "server-only";

import sanitizeHtml from "sanitize-html";

import { ApiError } from "@/lib/api/errors";
import { authenticatedRequest } from "@/lib/auth/request";
import type {
  CourseMedium,
  StudyCourseAccess,
  StudyCourseCatalogue,
  StudyCourseOption,
  StudyLanguage,
} from "@/lib/study/types";

type RawClassification = Record<string, unknown> & {
  Class_code?: string;
  Class_description?: string;
  Class_description_es?: string;
  id?: number | string;
};

type RawCourse = Record<string, unknown> & {
  clas_id?: number | string;
  completed_count?: number | string;
  end_enroll?: string | null;
  id?: number | string | null;
  reading_classification?: RawClassification | null;
  total_count?: number | string;
};

type RawCoursesPayload = {
  active_courses?: RawCourse[];
  es_access?: unknown;
  expired_courses?: RawCourse[];
  online_course_message?: string;
  previous_discount_message?: string;
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function enabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function count(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function classId(course: RawCourse): string | null {
  const value = course.reading_classification?.id ?? course.clas_id;
  return value == null ? null : String(value);
}

function isDemo(course: RawCourse): boolean {
  return course.id == null || course.reading_classification?.Class_code === "DEMO";
}

function spanishAllowed(course: RawCourse, medium: CourseMedium, esAccess: unknown): boolean {
  if (isDemo(course)) return true;
  const mediumFlag = medium === "video" ? course.videos_es : course.audio_es;
  return enabled(esAccess) && enabled(course.spanish_enabled) && enabled(mediumFlag);
}

function optionFrom(
  course: RawCourse,
  medium: CourseMedium,
  requestedLanguage: StudyLanguage,
  esAccess: unknown,
): StudyCourseOption | null {
  const classification = course.reading_classification;
  const classificationId = classId(course);
  if (!classification || !classificationId) return null;

  const language: StudyLanguage =
    requestedLanguage === "es" && spanishAllowed(course, medium, esAccess) ? "es" : "en";
  const spanishTitle = course.Class_description_es ?? classification.Class_description_es;
  const title = language === "es" && hasText(spanishTitle)
    ? spanishTitle.trim()
    : classification.Class_description?.trim() || `${medium === "video" ? "Video" : "Audio"} Course`;

  return {
    classificationId,
    completedCount: count(course.completed_count),
    endDate: hasText(course.end_enroll) ? course.end_enroll.trim() : null,
    isDemo: isDemo(course),
    language,
    medium,
    title,
    totalCount: count(course.total_count),
  };
}

async function getCourses(medium: CourseMedium): Promise<RawCoursesPayload> {
  return authenticatedRequest<RawCoursesPayload>(`/courses/${medium}`);
}

export async function getStudyCourseCatalogue(
  medium: CourseMedium,
  requestedLanguage: StudyLanguage,
): Promise<StudyCourseCatalogue> {
  const payload = await getCourses(medium);
  const makeOption = (course: RawCourse) => optionFrom(course, medium, requestedLanguage, payload.es_access);
  const messageHtml = payload.online_course_message || payload.previous_discount_message || "";

  return {
    activeCourses: (payload.active_courses || []).map(makeOption).filter((course): course is StudyCourseOption => course !== null),
    expiredCourses: (payload.expired_courses || []).map(makeOption).filter((course): course is StudyCourseOption => course !== null),
    language: requestedLanguage,
    medium,
    message: sanitizeHtml(messageHtml, { allowedTags: [], allowedAttributes: {} }).trim(),
  };
}

export async function verifyStudyCourseAccess(
  medium: CourseMedium,
  requestedClassId: string,
  requestedLanguage: StudyLanguage,
): Promise<StudyCourseAccess> {
  const catalogue = await getStudyCourseCatalogue(medium, requestedLanguage);
  const course = catalogue.activeCourses.find(({ classificationId }) => classificationId === requestedClassId);
  if (!course) {
    throw new ApiError(`You do not have access to this ${medium} course.`, 403);
  }
  return {
    classificationId: course.classificationId,
    isDemo: course.isDemo,
    language: course.language,
    medium,
    title: course.title,
  };
}
