import { describe, expect, it } from "vitest";

import { entryPathForUser, entryStageForUser, needsFirstLogin, sanitizeAgreementHtml } from "./entry";

describe("existing-student entry", () => {
  it("requires the agreement for unfinished first-login users", () => {
    const user = { firsttime: "1", enrollment_agreements: { id: 42 } };
    expect(needsFirstLogin(user)).toBe(true);
    expect(entryPathForUser(user)).toBe("/first-login");
    expect(entryStageForUser(user)).toBe("agreement");
  });

  it("keeps unfinished agreement-free users in account setup", () => {
    expect(entryStageForUser({ firsttime: 1 })).toBe("account_setup");
    expect(entryPathForUser({ firsttime: 1 })).toBe("/first-login");
  });

  it("preserves account setup after agreement acceptance resets the backend flag", () => {
    expect(entryStageForUser({ firsttime: 0 }, true)).toBe("account_setup");
    expect(entryPathForUser({ firsttime: 0 }, true)).toBe("/first-login");
  });

  it("allows completed or unflagged users into the dashboard", () => {
    expect(entryPathForUser({ firsttime: 0, enrollment_agreements: { id: 42 } })).toBe("/dashboard");
    expect(entryPathForUser({ firsttime: 6, enrollment_agreements: { id: 42 } })).toBe("/dashboard");
    expect(entryPathForUser({})).toBe("/dashboard");
  });

  it("removes executable agreement markup", () => {
    const html = sanitizeAgreementHtml('<p>Terms</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>');
    expect(html).toContain("<p>Terms</p>");
    expect(html).not.toContain("script");
    expect(html).not.toContain("javascript:");
  });
});
