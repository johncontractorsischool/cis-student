import { describe, expect, it } from "vitest";

import { entryPathForUser, needsFirstLogin, sanitizeAgreementHtml } from "./entry";

describe("existing-student entry", () => {
  it("requires the agreement for unfinished first-login users", () => {
    const user = { firsttime: "1", enrollment_agreements: { id: 42 } };
    expect(needsFirstLogin(user)).toBe(true);
    expect(entryPathForUser(user)).toBe("/first-login");
  });

  it("allows completed and agreement-free users into the dashboard", () => {
    expect(entryPathForUser({ firsttime: 0, enrollment_agreements: { id: 42 } })).toBe("/dashboard");
    expect(entryPathForUser({ firsttime: 6, enrollment_agreements: { id: 42 } })).toBe("/dashboard");
    expect(entryPathForUser({ firsttime: 1 })).toBe("/dashboard");
  });

  it("removes executable agreement markup", () => {
    const html = sanitizeAgreementHtml('<p>Terms</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>');
    expect(html).toContain("<p>Terms</p>");
    expect(html).not.toContain("script");
    expect(html).not.toContain("javascript:");
  });
});
