import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const firstLoginPrescreenSchema = z.object({
  hasLicense: z.boolean(),
});

const optionalText = (maximum: number) => z.string().trim().max(maximum).default("");

export const accountProfileSchema = z.object({
  address: optionalText(120),
  city: optionalText(80),
  lname: z.string().trim().min(1, "Last name is required.").max(80),
  mobilenum: z.string().trim().transform((value) => value.replace(/\D/g, "")).refine(
    (value) => value === "" || value.length === 10,
    "Enter a 10-digit phone number.",
  ),
  name: z.string().trim().min(1, "First name is required.").max(80),
  state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Choose a valid state."),
  zip: z.string().trim().refine(
    (value) => value === "" || /^\d{5}(?:-\d{4})?$/.test(value),
    "Enter a valid ZIP code.",
  ),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string()
    .min(6, "New password must be at least 6 characters.")
    .regex(/[A-Za-z]/, "New password must include a letter.")
    .regex(/\d/, "New password must include a number."),
  confirmPassword: z.string(),
}).superRefine((value, context) => {
  if (value.newPassword !== value.confirmPassword) {
    context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
  }
  if (value.currentPassword === value.newPassword) {
    context.addIssue({ code: "custom", path: ["newPassword"], message: "Choose a password different from your current password." });
  }
});

export const languageSchema = z.object({ lang: z.enum(["en", "es"]) });

export const deleteAccountSchema = z.object({ confirmation: z.literal("DELETE") });
