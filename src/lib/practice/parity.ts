import { z } from "zod";

export const PRACTICE_FEEDBACK_TYPES = ["spelling", "disagree", "other"] as const;

export const practiceIdentifierSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d{0,19}$/, "Practice test details are invalid.");

export const practiceFeedbackSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, "Add a comment before sending feedback.")
    .max(2000, "Comment must be 2,000 characters or fewer."),
  feedbackType: z.enum(PRACTICE_FEEDBACK_TYPES),
});
