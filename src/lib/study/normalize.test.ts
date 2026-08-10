import { describe, expect, it } from "vitest";

import { normalizeAudioCourse, normalizeVideoCourse, normalizeVideoDetail } from "./normalize";
import type { StudyCourseAccess } from "./types";

const videoAccess: StudyCourseAccess = {
  classificationId: "12",
  isDemo: false,
  language: "en",
  medium: "video",
  title: "B-General Building",
};

describe("study media normalization", () => {
  it("flattens intro videos and nested chapters while retaining watched state", () => {
    const course = normalizeVideoCourse({
      videos: {
        intro: { id: 1, name: "Welcome", type: 1, video_id: 10, watched: true },
        chapter: {
          id: 2,
          name: "Concrete",
          type: 0,
          sub_chapters: {
            one: { id: 3, name: "Foundations", type: 1, video_id: 11, watched: false },
          },
        },
      },
      redirect_url: "https://example.com/fallback",
    }, videoAccess);

    expect(course.totalCount).toBe(2);
    expect(course.completedCount).toBe(1);
    expect(course.sections.map((section) => section.title)).toEqual(["Course introduction", "Concrete"]);
    expect(course.sections[1].lessons[0].id).toBe("11");
  });

  it("builds Spanish audio URLs and previous/next navigation", () => {
    const course = normalizeAudioCourse({
      audios: [
        { id: 1, name: "Intro", name_es: "Introducción", audio_id: 20, audio: { audio_path: "https://media.test/intro.mp3", file_name_es: "intro-es.mp3" } },
        { id: 2, name: "Next", name_es: "Siguiente", audio_id: 21, audio: { audio_path: "https://media.test/next.mp3", file_name_es: "next-es.mp3" } },
      ],
    }, { ...videoAccess, language: "es", medium: "audio" });

    const lessons = course.sections.flatMap((section) => section.lessons);
    expect(lessons[0].sourceUrl).toBe("https://media.test/intro-es.mp3");
    expect(lessons[0].nextId).toBe("21");
    expect(lessons[1].previousId).toBe("20");
  });

  it("selects the localized video asset", () => {
    const detail = normalizeVideoDetail({
      video: {
        clas_id: 12,
        id: 8,
        name: "English",
        name_es: "Español",
        mp4_video: { video_url: "https://media.test/en.mp4" },
        mp4_video_es: { video_url: "https://media.test/es.mp4", video_thumb: "https://media.test/es.jpg" },
      },
    }, { ...videoAccess, language: "es" });

    expect(detail.title).toBe("Español");
    expect(detail.asset.videoUrl).toBe("https://media.test/es.mp4");
  });
});
