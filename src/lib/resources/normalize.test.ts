import { describe, expect, it } from "vitest";

import {
  normalizeResourceCatalogue,
  normalizeResourceCollection,
  safeResourceUrl,
} from "./normalize";

describe("resource normalization", () => {
  it("preserves active, expired, and inactive category states", () => {
    const result = normalizeResourceCatalogue({
      type: "resource",
      classes: [
        { id: 1, course_id: 11, name: "General Building" },
        { id: 2, course_id: 22, name: "Electrical", expired: true, expiration_date: "2026-08-01" },
        { id: 3, course_id: 33, name: "Plumbing", subscribed_class_status: "inactive" },
      ],
    });

    expect(result.categories.map(({ status }) => status)).toEqual(["active", "expired", "inactive"]);
    expect(result.categories[1].expirationDate).toBe("2026-08-01");
  });

  it("uses the resource course id and detects demo access", () => {
    const result = normalizeResourceCatalogue({
      type: "demo_resource",
      classes: [{ id: null, course_id: 99, name: "Resources (Demo)" }],
    });

    expect(result).toMatchObject({ type: "demo_resource", categories: [{ courseId: "99" }] });
  });

  it("normalizes the mobile resource fields", () => {
    const result = normalizeResourceCollection({
      classification: { Class_description: "B-General Building" },
      resources: [{ id: 7, Title: "CSLB", Organization: "State of California", Description: "License information", Link: "https://www.cslb.ca.gov/" }],
    }, "12");

    expect(result).toMatchObject({
      classId: "12",
      title: "B-General Building",
      resources: [{ id: "7", title: "CSLB", organization: "State of California" }],
    });
  });

  it("accepts only http and https resource links", () => {
    expect(safeResourceUrl("https://example.com/resource")).toBe("https://example.com/resource");
    expect(safeResourceUrl("javascript:alert(1)")).toBe("");
    expect(safeResourceUrl("not a url")).toBe("");
  });
});
