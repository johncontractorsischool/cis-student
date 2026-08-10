import { describe, expect, it } from "vitest";

import { effectiveExamSchedule } from "./exam-schedule";

describe("effectiveExamSchedule", () => {
  it("keeps live application dates authoritative", () => {
    expect(effectiveExamSchedule(
      {
        law_exam_scheduled_at: "2026-09-10",
        trade_exam_scheduled_at: "2026-09-11",
        state: "SCHEDULED",
      },
      { lawDate: "2026-10-01", tradeDate: "2026-10-02" },
      1,
    )).toMatchObject({
      law_exam_scheduled_at: "2026-09-10",
      trade_exam_scheduled_at: "2026-09-11",
      state: "SCHEDULED",
    });
  });

  it("uses legacy customer dates as a single-application fallback", () => {
    expect(effectiveExamSchedule(
      null,
      { lawDate: "2026-10-01", tradeDate: "2026-10-02" },
      1,
    )).toEqual({
      law_exam_scheduled_at: "2026-10-01",
      trade_exam_scheduled_at: "2026-10-02",
      scheduled: true,
      state: "SCHEDULED",
    });
  });

  it("never shares customer-level fallback dates across applications", () => {
    expect(effectiveExamSchedule(
      null,
      { lawDate: "2026-10-01", tradeDate: "2026-10-02" },
      2,
    )).toBeNull();
  });
});
