import { describe, expect, it } from "vitest";

import { learningAreaForPathname } from "./learning-navigation";

describe("learningAreaForPathname", () => {
  it.each([
    ["/practice", "practice"],
    ["/practice/test/42/attempt", "practice"],
    ["/courses/video", "video"],
    ["/videos/18", "video"],
    ["/videos/watch/99", "video"],
    ["/courses/reading", "reading"],
    ["/reading/18/99", "reading"],
    ["/courses/audio", "audio"],
    ["/audio/18/99", "audio"],
    ["/resources", "resources"],
    ["/resources/18/report/99", "resources"],
  ])("maps %s to %s", (pathname, area) => {
    expect(learningAreaForPathname(pathname)).toBe(area);
  });

  it.each(["/", "/dashboard", "/login", "/contract-forms", "/practice-room"])(
    "does not show on %s",
    (pathname) => expect(learningAreaForPathname(pathname)).toBeNull(),
  );
});
