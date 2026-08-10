import sanitizeHtml from "sanitize-html";

import type {
  ReadingAccess,
  ReadingChapter,
  ReadingCourse,
  ReadingTopic,
} from "@/lib/reading/types";

type RawNode = Record<string, unknown> & {
  chapters?: Record<string, RawNode> | RawNode[];
  contents?: Record<string, RawNode> | RawNode[];
  first_content?: number | string | null;
  id?: number | string;
  read?: unknown;
  subchapters?: Record<string, RawNode> | RawNode[];
  title?: string;
  title_es?: string;
  type?: string;
};

type RawContent = RawNode & {
  content?: string;
  content_es?: string;
};

export type RawReadingPayload = {
  reading_courses?: Record<string, RawNode> | RawNode[];
  reading_courses_contents?: RawContent[];
};

function values<T>(record: Record<string, T> | T[] | undefined): T[] {
  if (Array.isArray(record)) return record;
  return record && typeof record === "object" ? Object.values(record) : [];
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRead(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function localized(
  english: unknown,
  spanish: unknown,
  preferSpanish: boolean,
): string {
  if (preferSpanish && hasText(spanish)) return spanish.trim();
  return hasText(english) ? english.trim() : "";
}

export function sanitizeReadingHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "a", "article", "b", "blockquote", "br", "caption", "code", "col", "colgroup",
      "dd", "div", "dl", "dt", "em", "figcaption", "figure", "h1", "h2", "h3", "h4",
      "h5", "h6", "hr", "i", "iframe", "img", "li", "ol", "p", "pre", "section",
      "small", "span", "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th",
      "thead", "tr", "u", "ul",
    ],
    allowedAttributes: {
      "*": ["class", "id", "style", "title"],
      a: ["href", "name", "target", "rel"],
      col: ["span", "width"],
      colgroup: ["span", "width"],
      iframe: ["allow", "allowfullscreen", "height", "loading", "sandbox", "src", "title", "width"],
      img: ["alt", "height", "loading", "src", "width"],
      td: ["colspan", "rowspan", "scope"],
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
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          ...(attribs.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
        },
      }),
      iframe: (_tagName, attribs) => ({
        tagName: "iframe",
        attribs: {
          ...attribs,
          loading: "lazy",
          sandbox: "allow-scripts allow-same-origin allow-popups",
        },
      }),
      img: (_tagName, attribs) => ({
        tagName: "img",
        attribs: { ...attribs, loading: "lazy" },
      }),
    },
  });
}

function collectTopicNodes(category: RawNode): RawNode[] {
  const result: RawNode[] = [];

  for (const chapter of values(category.chapters)) {
    if (chapter.type === "content") {
      result.push(chapter);
      continue;
    }

    for (const subchapter of values(chapter.subchapters)) {
      if (subchapter.type === "content") {
        result.push(subchapter);
        continue;
      }
      result.push(...values(subchapter.contents));
    }
  }

  return result;
}

export function normalizeReadingCourse(
  payload: RawReadingPayload,
  access: ReadingAccess,
): ReadingCourse {
  const preferSpanish = access.language === "es";
  const contentById = new Map(
    (payload.reading_courses_contents || []).map((content) => [String(content.id), content]),
  );

  const chapters: ReadingChapter[] = values(payload.reading_courses)
    .map((category) => {
      const title = localized(category.title, category.title_es, preferSpanish);
      const topics: ReadingTopic[] = collectTopicNodes(category)
        .map((node) => {
          const content = contentById.get(String(node.id));
          if (!content?.id) return null;

          const spanishTitle = content.title_es || node.title_es;
          if (preferSpanish && !access.isDemo && !hasText(spanishTitle)) {
            return null;
          }

          const topicTitle = localized(
            content.title || node.title,
            spanishTitle,
            preferSpanish,
          );
          if (!topicTitle) return null;

          const body = localized(content.content, content.content_es, preferSpanish);
          return {
            contentHtml: sanitizeReadingHtml(body),
            id: String(content.id),
            read: isRead(node.read),
            title: topicTitle,
          } satisfies ReadingTopic;
        })
        .filter((topic): topic is ReadingTopic => topic !== null);

      if (!title || topics.length === 0) return null;
      return {
        complete: topics.every((topic) => topic.read),
        id: String(category.id),
        title,
        topics,
      } satisfies ReadingChapter;
    })
    .filter((chapter): chapter is ReadingChapter => chapter !== null);

  const completedChapters = chapters.filter((chapter) => chapter.complete).length;
  const totalChapters = chapters.length;
  const progressPercent = totalChapters
    ? Math.round((completedChapters / totalChapters) * 100)
    : 0;

  return {
    chapters,
    classificationId: access.classificationId,
    completedChapters,
    isDemo: access.isDemo,
    language: access.language,
    progressPercent,
    remainingChapters: totalChapters - completedChapters,
    title: access.title,
    totalChapters,
  };
}
