import "server-only";

import { z } from "zod";

const envSchema = z.object({
  API_BASE_URL: z.url().default("https://api.contractorsischool.com/api/v2"),
  CIS_API_KEY: z.string().trim().min(1).optional(),
  WEB_BASE_URL: z.url().default("https://www.contractorsischool.com"),
  IAPPLICATION_DEMO_SIGNUP_URL: z
    .url()
    .default("https://apps.demo.contractorsischool.com/signup"),
  IAPPLICATION_LAUNCH_URL: z
    .url()
    .default("https://www.contractorsischool.com/iapplication/launch"),
  SHOPIFY_DOMAIN: z.url().default("https://www.lexanasignature.com"),
});

export const env = envSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
  CIS_API_KEY: process.env.CIS_API_KEY,
  WEB_BASE_URL: process.env.WEB_BASE_URL,
  IAPPLICATION_DEMO_SIGNUP_URL: process.env.IAPPLICATION_DEMO_SIGNUP_URL,
  IAPPLICATION_LAUNCH_URL: process.env.IAPPLICATION_LAUNCH_URL,
  SHOPIFY_DOMAIN: process.env.SHOPIFY_DOMAIN,
});
