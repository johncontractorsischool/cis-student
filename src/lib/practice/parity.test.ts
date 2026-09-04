import { describe, expect, it } from "vitest";

import { normalizePracticeVideoExplanation } from "./normalize";
import { practiceFeedbackSchema, practiceIdentifierSchema } from "./parity";

describe("practice-test parity contracts", () => {
  it("accepts the feedback values used by the student apps and trims comments", () => {
    expect(practiceFeedbackSchema.parse({ feedbackType: "disagree", comment: "  Please review this answer.  " })).toEqual({
      feedbackType: "disagree",
      comment: "Please review this answer.",
    });
  });

  it("rejects unsupported feedback, empty or oversized comments, and unsafe identifiers", () => {
    expect(practiceFeedbackSchema.safeParse({ feedbackType: "answer", comment: "Details" }).success).toBe(false);
    expect(practiceFeedbackSchema.safeParse({ feedbackType: "other", comment: "  " }).success).toBe(false);
    expect(practiceFeedbackSchema.safeParse({ feedbackType: "other", comment: "x".repeat(2001) }).success).toBe(false);
    expect(practiceIdentifierSchema.safeParse("../12").success).toBe(false);
  });

  it("normalizes only safe browser-playable explanation video URLs", () => {
    expect(normalizePracticeVideoExplanation({
      video: {
        name: "Why this answer is correct",
        mp4_video: { video_url: "https://media.example/explanation.mp4", video_thumb: "https://media.example/poster.jpg" },
      },
    })).toEqual({
      thumbnailUrl: "https://media.example/poster.jpg",
      title: "Why this answer is correct",
      videoUrl: "https://media.example/explanation.mp4",
    });
    expect(normalizePracticeVideoExplanation({ video: { mp4_video: { video_url: "javascript:alert(1)" } } })).toBeNull();
  });
});
