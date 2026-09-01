import { describe, expect, it } from "vitest";

import { accountProfileFromUser, canDeleteAccount } from "./presentation";

describe("account presentation", () => {
  it("exposes only editable profile fields with safe defaults", () => {
    expect(accountProfileFromUser({
      address: null,
      email: " student@example.com ",
      lang: "es",
      lname: "Student",
      name: "Test",
      secret: "not exposed",
    })).toEqual({
      address: "",
      canDelete: false,
      city: "",
      email: "student@example.com",
      firstName: "Test",
      language: "es",
      lastName: "Student",
      phone: "",
      state: "CA",
      zip: "",
    });
  });

  it("matches the mobile account deletion eligibility", () => {
    expect(canDeleteAccount({ account_type: 3, created_platform: 1 })).toBe(true);
    expect(canDeleteAccount({ account_type: "4", created_platform: "2" })).toBe(true);
    expect(canDeleteAccount({ account_type: 1, created_platform: 1 })).toBe(false);
    expect(canDeleteAccount({ account_type: 3, created_platform: 2 })).toBe(false);
  });
});
