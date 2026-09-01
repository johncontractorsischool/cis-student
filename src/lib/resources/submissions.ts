import { z } from "zod";

import { RESOURCE_REPORT_ISSUES } from "./types";

export const resourceIdentifierSchema = z.string().trim().min(1).max(191);

export const resourceRecommendationSchema = z.object({
  comment: z.string().trim().max(2000, "Comment must be 2,000 characters or fewer.").optional().default(""),
  link: z
    .string()
    .trim()
    .url("Enter a valid resource link.")
    .max(2048, "Resource link must be 2,048 characters or fewer.")
    .refine((value) => {
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, "Enter an http or https resource link."),
});

export const resourceReportSchema = z.object({
  comment: z.string().trim().max(2000, "Comment must be 2,000 characters or fewer.").optional().default(""),
  issue: z.enum(RESOURCE_REPORT_ISSUES),
});
