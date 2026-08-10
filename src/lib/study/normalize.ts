import type {
  AudioCourse,
  AudioLesson,
  MediaCourse,
  MediaLesson,
  MediaSection,
  StudyCourseAccess,
  VideoLessonDetail,
} from "@/lib/study/types";

type RawMediaNode = Record<string, unknown> & {
  audio?: Record<string, unknown>;
  audio_id?: number | string;
  id?: number | string;
  name?: string;
  name_es?: string;
  sub_chapters?: Record<string, RawMediaNode> | RawMediaNode[];
  type?: number | string;
  video_id?: number | string;
  watched?: unknown;
};

export type RawMediaCoursePayload = {
  audios?: Record<string, RawMediaNode> | RawMediaNode[];
  redirect_url?: string;
  videos?: Record<string, RawMediaNode> | RawMediaNode[];
};

export type RawVideoDetailPayload = {
  nextVideoId?: number | string | null;
  previousVideoId?: number | string | null;
  video?: Record<string, unknown>;
  videoCategory?: Record<string, unknown>;
};

function values<T>(value: Record<string, T> | T[] | undefined): T[] {
  if (Array.isArray(value)) return value;
  return value && typeof value === "object" ? Object.values(value) : [];
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function watched(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function localized(english: unknown, spanish: unknown, preferSpanish: boolean): string {
  if (preferSpanish && hasText(spanish)) return spanish.trim();
  return hasText(english) ? english.trim() : "";
}

function baseSections(
  nodes: RawMediaNode[],
  idKey: "video_id" | "audio_id",
  preferSpanish: boolean,
): Array<{ id: string; nodes: RawMediaNode[]; title: string }> {
  const intro: RawMediaNode[] = [];
  const sections: Array<{ id: string; nodes: RawMediaNode[]; title: string }> = [];

  for (const node of nodes) {
    if (node.sub_chapters) {
      const title = localized(node.name, node.name_es, preferSpanish);
      const mediaNodes = values(node.sub_chapters).filter((item) => item[idKey] != null);
      if (title && mediaNodes.length) sections.push({ id: String(node.id ?? title), nodes: mediaNodes, title });
    } else if (node[idKey] != null) {
      intro.push(node);
    }
  }

  if (intro.length) {
    sections.unshift({
      id: "course-introduction",
      nodes: intro,
      title: preferSpanish ? "Introducción del curso" : "Course introduction",
    });
  }
  return sections;
}

export function normalizeVideoCourse(
  payload: RawMediaCoursePayload,
  access: StudyCourseAccess,
): MediaCourse {
  const preferSpanish = access.language === "es";
  const sections: MediaSection[] = baseSections(values(payload.videos), "video_id", preferSpanish)
    .map((section) => ({
      id: section.id,
      title: section.title,
      lessons: section.nodes.map((node) => {
        const title = localized(node.name, node.name_es, preferSpanish);
        if (!title || node.video_id == null) return null;
        return { id: String(node.video_id), title, watched: watched(node.watched) } satisfies MediaLesson;
      }).filter((lesson): lesson is MediaLesson => lesson !== null),
    }))
    .filter((section) => section.lessons.length > 0);
  const lessons = sections.flatMap((section) => section.lessons);

  return {
    ...access,
    completedCount: lessons.filter((lesson) => lesson.watched).length,
    redirectUrl: hasText(payload.redirect_url) ? payload.redirect_url : "",
    sections,
    totalCount: lessons.length,
  };
}

function replaceFileName(url: string, fileName: string): string {
  const slash = url.lastIndexOf("/");
  return slash >= 0 ? `${url.slice(0, slash + 1)}${fileName}` : fileName;
}

export function normalizeAudioCourse(
  payload: RawMediaCoursePayload,
  access: StudyCourseAccess,
): AudioCourse {
  const preferSpanish = access.language === "es";
  const rawSections = baseSections(values(payload.audios), "audio_id", preferSpanish);
  const flat: AudioLesson[] = [];
  const sections = rawSections.map((section) => {
    const lessons = section.nodes.map((node) => {
      const audio = node.audio || {};
      const id = node.audio_id;
      const title = localized(
        node.name || audio.description || audio.name,
        node.name_es || audio.description_es || audio.name_es,
        preferSpanish,
      );
      let sourceUrl = hasText(audio.audio_path) ? audio.audio_path.trim() : "";
      if (preferSpanish && hasText(audio.file_name_es) && sourceUrl) {
        sourceUrl = replaceFileName(sourceUrl, audio.file_name_es.trim());
      }
      if (id == null || !title || !sourceUrl) return null;
      const lesson: AudioLesson = {
        classId: access.classificationId,
        id: String(id),
        nextId: null,
        previousId: null,
        sourceUrl,
        title,
        watched: watched(node.watched),
      };
      flat.push(lesson);
      return lesson;
    }).filter((lesson): lesson is AudioLesson => lesson !== null);
    return { id: section.id, lessons, title: section.title };
  }).filter((section) => section.lessons.length > 0);

  flat.forEach((lesson, index) => {
    lesson.previousId = flat[index - 1]?.id || null;
    lesson.nextId = flat[index + 1]?.id || null;
  });

  return {
    ...access,
    completedCount: flat.filter((lesson) => lesson.watched).length,
    redirectUrl: hasText(payload.redirect_url) ? payload.redirect_url : "",
    sections,
    totalCount: flat.length,
  };
}

export function normalizeVideoDetail(
  payload: RawVideoDetailPayload,
  access: StudyCourseAccess,
): VideoLessonDetail {
  const video = payload.video || {};
  const preferSpanish = access.language === "es";
  const assetValue = preferSpanish ? video.mp4_video_es : video.mp4_video;
  const asset = assetValue && typeof assetValue === "object" ? assetValue as Record<string, unknown> : {};
  const id = video.id;
  if (id == null) throw new Error("Video details are unavailable.");
  return {
    asset: {
      redirect: watched(asset.redirect),
      redirectUrl: hasText(asset.redirect_url) ? asset.redirect_url.trim() : "",
      thumbnailUrl: hasText(asset.video_thumb) ? asset.video_thumb.trim() : "",
      videoUrl: hasText(asset.video_url) ? asset.video_url.trim() : "",
    },
    classId: access.classificationId,
    id: String(id),
    language: access.language,
    nextId: payload.nextVideoId == null ? null : String(payload.nextVideoId),
    previousId: payload.previousVideoId == null ? null : String(payload.previousVideoId),
    title: localized(video.name, video.name_es, preferSpanish) || "Course video",
  };
}
