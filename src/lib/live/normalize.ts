import type { User } from "@/lib/api/types";
import { isDemoAccount } from "../domain/demo";
import type {
  LiveClassCatalogue,
  LiveClassSection,
  LiveClassSession,
  LiveClassSessionStatus,
  LiveClassVideoDetail,
} from "@/lib/live/types";
import type { StudyLanguage } from "@/lib/study/types";

type RawRecord = Record<string, unknown>;

export type RawLiveClassesPayload = {
  redirect_url?: unknown;
  videos?: RawRecord[] | Record<string, RawRecord>;
};

export type RawLiveClassDetailPayload = {
  video?: RawRecord;
};

function record(value: unknown): RawRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawRecord)
    : {};
}

function values(value: unknown): RawRecord[] {
  if (Array.isArray(value)) return value.filter((item): item is RawRecord => Boolean(item) && typeof item === "object");
  return Object.values(record(value)).filter((item): item is RawRecord => Boolean(item) && typeof item === "object");
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function truthy(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function localized(english: unknown, spanish: unknown, language: StudyLanguage): string {
  const spanishText = text(spanish);
  return language === "es" && spanishText ? spanishText : text(english);
}

function normalizeName(value: unknown): string {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function status(value: unknown): LiveClassSessionStatus {
  if (value === "live" || value === "pre_recorded") return value;
  return "archive";
}

function isExternalUrl(value: unknown): value is string {
  return /^https?:\/\//i.test(text(value));
}

export function resolveLiveClassDestination(video: RawRecord, fallbackUrl: string): string {
  if (isExternalUrl(video.vimeo_path)) return text(video.vimeo_path);
  if (isExternalUrl(video.code)) return text(video.code);
  const code = text(video.code);
  if (code) return `https://player.vimeo.com/video/${encodeURIComponent(code)}`;
  return isExternalUrl(fallbackUrl) ? fallbackUrl : "";
}

function visibleCategories(
  categories: RawRecord[],
  demoAccount: boolean,
  language: StudyLanguage,
): RawRecord[] {
  if (!demoAccount) return categories;
  const target = language === "es" ? "demostracion en vivo" : "live class demo";
  const filtered = categories
    .map((category) => {
      const sessions = values(category.live_class_videos);
      const categoryMatches = [category.Class_description, category.Class_description_es]
        .some((name) => normalizeName(name) === target);
      const matching = [
        ...(categoryMatches ? sessions : []),
        ...sessions.filter((session) => [session.name, session.name_es]
          .some((name) => normalizeName(name) === target)),
      ].filter((session, index, all) =>
        all.findIndex((candidate) => String(candidate.id) === String(session.id)) === index,
      );
      return { ...category, live_class_videos: matching };
    })
    .filter((category) => values(category.live_class_videos).length > 0);

  return filtered.length ? filtered : categories;
}

function normalizeSession(
  raw: RawRecord,
  fallbackUrl: string,
  language: StudyLanguage,
): LiveClassSession | null {
  if (raw.id == null) return null;
  const title = localized(raw.name, raw.name_es, language);
  if (!title) return null;
  const sessionStatus = status(raw.status);
  return {
    destinationUrl:
      sessionStatus === "live" ? resolveLiveClassDestination(raw, fallbackUrl) : "",
    id: String(raw.id),
    status: sessionStatus,
    title,
  };
}

export function normalizeLiveClassCatalogue(
  payload: RawLiveClassesPayload,
  user: User,
  rawStatus: unknown,
  rawApp: unknown,
  language: StudyLanguage,
): LiveClassCatalogue {
  const fallbackUrl = text(payload.redirect_url);
  const categories = visibleCategories(values(payload.videos), isDemoAccount(user), language);
  const sections = categories.map((category, index) => {
    const sessions = values(category.live_class_videos)
      .map((session) => normalizeSession(session, fallbackUrl, language))
      .filter((session): session is LiveClassSession => session !== null);
    return {
      id: String(category.id ?? `live-section-${index + 1}`),
      sessions,
      title: localized(category.Class_description, category.Class_description_es, language) ||
        (language === "es" ? "Clase en vivo" : "Live Class"),
    } satisfies LiveClassSection;
  }).filter((section) => section.sessions.length > 0);

  const statusRecord = record(rawStatus);
  const statusValue = statusRecord.live_class_status ?? rawStatus;
  const app = record(rawApp);
  const announcementTitle = text(app.live_stream_title);
  const announcement = truthy(app.live_stream_live) && announcementTitle
    ? {
        description: text(app.live_stream_description),
        title: announcementTitle,
      }
    : null;

  return {
    announcement,
    fallbackUrl: isExternalUrl(fallbackUrl) ? fallbackUrl : "",
    isLive: truthy(statusValue) || sections.some((section) =>
      section.sessions.some((session) => session.status === "live"),
    ),
    language,
    sections,
  };
}

export function normalizeLiveClassDetail(
  payload: RawLiveClassDetailPayload,
  language: StudyLanguage,
): LiveClassVideoDetail {
  const video = record(payload.video);
  if (video.id == null) throw new Error("Live Class recording is unavailable.");
  const category = record(video.video_category);
  const englishAsset = record(video.mp4_video);
  const spanishAsset = record(video.mp4_video_es);
  const asset = language === "es" && Object.keys(spanishAsset).length ? spanishAsset : englishAsset;
  const directVideoUrl = text(asset.video_url);
  const resolvedRedirect = text(asset.redirect_url) || resolveLiveClassDestination(video, "");

  return {
    asset: {
      redirect: truthy(asset.redirect) || !directVideoUrl,
      redirectUrl: isExternalUrl(resolvedRedirect) ? resolvedRedirect : "",
      thumbnailUrl: text(asset.video_thumb),
      videoUrl: directVideoUrl,
    },
    categoryTitle: localized(
      category.Class_description,
      category.Class_description_es,
      language,
    ) || (language === "es" ? "Clase en vivo" : "Live Class"),
    id: String(video.id),
    language,
    status: status(video.status),
    title: localized(video.name, video.name_es, language) ||
      (language === "es" ? "Grabación de clase" : "Class recording"),
  };
}
