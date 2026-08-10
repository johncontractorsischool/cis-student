import { describe, expect, it } from "vitest";

import { calculateStudyProgress, progressColor } from "./progress";

describe("calculateStudyProgress", () => {
  it("weights exams at 70% and videos at 30% when both exist", () => {
    expect(
      calculateStudyProgress({
        exams: { completed: 8, total: 10 },
        videos: { completed: 5, total: 10 },
      }),
    ).toBe(71);
  });

  it("uses the only available source at full weight", () => {
    expect(
      calculateStudyProgress({
        exams: { completed: 3, total: 4 },
        videos: { completed: 0, total: 0 },
      }),
    ).toBe(75);
  });

  it("returns zero for invalid or out-of-range data", () => {
    expect(
      calculateStudyProgress({ exams: { completed: 5, total: 2 } }),
    ).toBe(0);
    expect(calculateStudyProgress(undefined)).toBe(0);
  });
});

describe("progressColor", () => {
  it("uses the parity thresholds", () => {
    expect(progressColor(49.99)).toBe("#b85551");
    expect(progressColor(50)).toBe("#df984d");
    expect(progressColor(80)).toBe("#49982b");
  });
});
