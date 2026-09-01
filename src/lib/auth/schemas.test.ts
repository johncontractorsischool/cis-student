import { describe, expect, it } from "vitest";

import {
  accountProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
  languageSchema,
} from "./schemas";

describe("account schemas", () => {
  it("normalizes editable profile values", () => {
    expect(accountProfileSchema.parse({
      address: " 123 Main Street ",
      city: " Sacramento ",
      lname: " Student ",
      mobilenum: "(916) 555-1212",
      name: " Fixture ",
      state: "ca",
      zip: "95814-1234",
    })).toEqual({
      address: "123 Main Street",
      city: "Sacramento",
      lname: "Student",
      mobilenum: "9165551212",
      name: "Fixture",
      state: "CA",
      zip: "95814-1234",
    });
  });

  it("rejects invalid contact fields", () => {
    const result = accountProfileSchema.safeParse({
      address: "",
      city: "",
      lname: "Student",
      mobilenum: "555-1212",
      name: "Fixture",
      state: "California",
      zip: "9581",
    });
    expect(result.success).toBe(false);
  });

  it("requires a distinct matching password with a letter and number", () => {
    expect(changePasswordSchema.safeParse({
      currentPassword: "oldpass1",
      newPassword: "newpass1",
      confirmPassword: "newpass1",
    }).success).toBe(true);
    expect(changePasswordSchema.safeParse({
      currentPassword: "samepass1",
      newPassword: "samepass1",
      confirmPassword: "samepass1",
    }).success).toBe(false);
    expect(changePasswordSchema.safeParse({
      currentPassword: "oldpass1",
      newPassword: "letters",
      confirmPassword: "different1",
    }).success).toBe(false);
  });

  it("locks language and deletion inputs to allowed values", () => {
    expect(languageSchema.safeParse({ lang: "es" }).success).toBe(true);
    expect(languageSchema.safeParse({ lang: "fr" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirmation: "DELETE" }).success).toBe(true);
    expect(deleteAccountSchema.safeParse({ confirmation: "delete" }).success).toBe(false);
  });
});
