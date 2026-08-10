import { describe, expect, it } from "vitest";

import {
  normalizeLiveClassCatalogue,
  normalizeLiveClassDetail,
  resolveLiveClassDestination,
} from "./normalize";

describe("Live Class normalization", () => {
  it("filters demo accounts to the localized demo session", () => {
    const result = normalizeLiveClassCatalogue(
      {
        videos: [{
          id: 1,
          Class_description: "Demo classes",
          live_class_videos: [
            { id: 10, name: "Live Class Demo", name_es: "Demostración en vivo", status: "archive" },
            { id: 11, name: "Other session", status: "archive" },
          ],
        }],
      },
      { demo_account: 1 },
      { live_class_status: 0 },
      {},
      "es",
    );

    expect(result.sections[0]?.sessions).toHaveLength(1);
    expect(result.sections[0]?.sessions[0]?.title).toBe("Demostración en vivo");
  });

  it("preserves all classes when a demo-named session is unavailable", () => {
    const result = normalizeLiveClassCatalogue(
      { videos: [{ id: 1, Class_description: "General", live_class_videos: [{ id: 5, name: "Welcome", status: "pre_recorded" }] }] },
      { demo_account: true },
      0,
      {},
      "en",
    );
    expect(result.sections[0]?.sessions[0]?.title).toBe("Welcome");
  });

  it("uses the live destination precedence from the mobile app", () => {
    expect(resolveLiveClassDestination({ vimeo_path: "https://live.example/room", code: "123" }, "https://fallback.example")).toBe("https://live.example/room");
    expect(resolveLiveClassDestination({ code: "123" }, "https://fallback.example")).toBe("https://player.vimeo.com/video/123");
  });

  it("normalizes archived recording details and Spanish fallback", () => {
    const result = normalizeLiveClassDetail({
      video: {
        id: 20,
        name: "Recorded class",
        status: "archive",
        video_category: { Class_description: "B General Building" },
        mp4_video: { video_url: "https://media.example/class.mp4", video_thumb: "https://media.example/class.jpg" },
      },
    }, "es");
    expect(result.title).toBe("Recorded class");
    expect(result.categoryTitle).toBe("B General Building");
    expect(result.asset.redirect).toBe(false);
  });
});
