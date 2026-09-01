import { describe, expect, it } from "vitest";

import { resourceRecommendationSchema, resourceReportSchema } from "./submissions";

describe("resource submissions", () => {
  it("accepts the backend's recommendation shape and trims it", () => {
    expect(resourceRecommendationSchema.parse({ link: " https://example.com/help ", comment: " useful " })).toEqual({
      link: "https://example.com/help",
      comment: "useful",
    });
  });

  it("rejects unsafe resource protocols and oversized comments", () => {
    expect(resourceRecommendationSchema.safeParse({ link: "javascript:alert(1)" }).success).toBe(false);
    expect(resourceRecommendationSchema.safeParse({ link: "https://example.com", comment: "x".repeat(2001) }).success).toBe(false);
  });

  it("only accepts issue values supported by the backend UI contract", () => {
    expect(resourceReportSchema.safeParse({ issue: "Link Doesn't Work", comment: "" }).success).toBe(true);
    expect(resourceReportSchema.safeParse({ issue: "Made up" }).success).toBe(false);
  });
});
