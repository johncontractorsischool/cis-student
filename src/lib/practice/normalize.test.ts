import { describe, expect, it } from "vitest";

import { normalizePracticeIndex, normalizePracticeTestDetail, normalizePracticeTestList } from "./normalize";

describe("practice-test normalization", () => {
  it("normalizes classifications and paid test lists", () => {
    const index = normalizePracticeIndex({ classes: [{ id: 12, test_category_id: 4, name: "General Building", total_count: 3, completed_count: 1 }], type: "practice_test" }, "en");
    const list = normalizePracticeTestList({ tests: [{ id: 9, tital: "Exam 1", is_test_completed: true, last_attempt_score: 84 }] }, index.categories[0], "en");
    expect(index.categories[0].title).toBe("General Building");
    expect(list.tests[0]).toMatchObject({ completed: true, lastAttemptScore: 84, title: "Exam 1" });
  });

  it("sanitizes question HTML and uses backend timing and passing rules", () => {
    const detail = normalizePracticeTestDetail({
      test: { id: 9, tital: "Exam 1", timing: 2, number_of_marks: 2, passing: 75, category: { name: "Trade" } },
      questions: [{ id: 1, ques: "<p>Safe</p><script>alert(1)</script>", ans1: "One", ans2: "Two", ans3: "Three", ans4: "Four", correct: "B", explanation: "<b>Because</b>" }],
    }, { attempt_history: [{ id: 4, date: "08/05/2026", score: 70 }] }, "en", "100");

    expect(detail.timeLimitSeconds).toBe(7200);
    expect(detail.passingPercent).toBe(75);
    expect(detail.fullScore).toBe(2);
    expect(detail.questions[0].html).toBe("<p>Safe</p>");
    expect(detail.questions[0].correctAnswer).toBe("B");
    expect(detail.attemptKey).toContain(":100:9");
  });
});
