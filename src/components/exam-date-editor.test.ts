import { describe, expect, it } from "vitest";

import { examDateValue } from "./exam-date-editor";

describe("exam date editor", () => {
  it("preserves date-only values from Supabase timestamps", () => {
    expect(examDateValue("2026-09-10T00:00:00.000Z")).toBe("2026-09-10");
    expect(examDateValue("2026-09-12")).toBe("2026-09-12");
  });

  it("does not invent a date for missing or malformed values", () => {
    expect(examDateValue(null)).toBe("");
    expect(examDateValue("September 10")).toBe("");
  });
});
