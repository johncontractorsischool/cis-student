import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import {
  accountFor,
  deployedOrigin,
  expectedHosts,
  requireAccounts,
  signInSuccessfully,
} from "./support/live-config";

type ApiEnvelope<T> = { data?: T; error?: { message?: string }; message?: string };
type CourseCatalogue = { activeCourses?: Array<{ classificationId?: string }> };
type MediaCourse = { sections?: Array<{ lessons?: Array<{ id?: string; sourceUrl?: string }> }> };
type VideoDetail = { asset?: { redirect?: boolean; videoUrl?: string } };
type ResourceCatalogue = {
  categories?: Array<{ courseId?: string; status?: string }>;
};
type ResourceCollection = {
  resources?: Array<{ id?: string; url?: string }>;
};
type ContractFormsPayload = {
  checkoutBaseUrl?: string;
  products?: Array<{ id?: string; price?: number; variantId?: string }>;
};

async function apiData<T>(page: Page, path: string): Promise<T> {
  const response = await page.request.get(path);
  expect(response.status(), `${path} should return 200`).toBe(200);
  const envelope = await response.json() as ApiEnvelope<T>;
  expect(envelope.data, `${path} should return a data envelope`).toBeTruthy();
  return envelope.data!;
}

function firstLesson(course: MediaCourse): { id?: string; sourceUrl?: string } {
  const lesson = course.sections?.flatMap((section) => section.lessons || [])[0];
  expect(lesson, "The active media account needs at least one lesson").toBeTruthy();
  return lesson!;
}

async function probeRangeSupport(
  request: APIRequestContext,
  mediaUrl: string,
  label: "audio" | "video",
): Promise<void> {
  let response;
  try {
    response = await request.get(mediaUrl, {
      headers: { Origin: deployedOrigin(), Range: "bytes=0-1" },
      timeout: 30_000,
    });
  } catch {
    throw new Error(`The ${label} media host could not be reached.`);
  }

  const headers = response.headers();
  if (response.status() !== 206) {
    throw new Error(`The ${label} media host returned ${response.status()} instead of 206 for a range request.`);
  }
  if (!headers["content-range"]?.toLowerCase().startsWith("bytes 0-1/")) {
    throw new Error(`The ${label} media host did not return a valid Content-Range header.`);
  }
  if (headers["accept-ranges"]?.toLowerCase() !== "bytes") {
    throw new Error(`The ${label} media host did not advertise Accept-Ranges: bytes.`);
  }
  const allowedOrigin = headers["access-control-allow-origin"];
  if (allowedOrigin !== "*" && allowedOrigin !== deployedOrigin()) {
    throw new Error(`The ${label} media host does not allow the deployed student origin.`);
  }
}

test.describe("@staging @production deployed integration verification", () => {
  test.beforeAll(() => {
    deployedOrigin();
    expectedHosts("E2E_EXPECTED_RENEWAL_HOSTS");
    expectedHosts("E2E_EXPECTED_SHOPIFY_HOST");
    requireAccounts(["active", "expired", "contractFormsEligible", "contractFormsIneligible"]);
  });

  test("Vercel server routes can reach Contractor API", async ({ page }) => {
    await signInSuccessfully(page, accountFor("active"));
    for (const path of ["/api/dashboard", "/api/practice", "/api/courses/video", "/api/courses/audio", "/api/reading/entry", "/api/live", "/api/resources"]) {
      const response = await page.request.get(path);
      expect(response.status(), `${path} should reach Contractor API`).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");
    }
  });

  test("direct video and audio assets support CORS byte ranges", async ({ page, request }) => {
    await signInSuccessfully(page, accountFor("active"));

    const videoCatalogue = await apiData<CourseCatalogue>(page, "/api/courses/video");
    const videoClassId = videoCatalogue.activeCourses?.[0]?.classificationId;
    expect(videoClassId, "The active account needs a direct video course").toBeTruthy();
    const videoCourse = await apiData<MediaCourse>(page, `/api/videos/${encodeURIComponent(videoClassId!)}`);
    const videoLesson = firstLesson(videoCourse);
    const video = await apiData<VideoDetail>(page, `/api/videos/watch/${encodeURIComponent(videoLesson.id!)}`);
    expect(video.asset?.redirect, "The verification account needs a browser-direct video asset").toBe(false);
    expect(video.asset?.videoUrl).toBeTruthy();
    await probeRangeSupport(request, video.asset!.videoUrl!, "video");

    const audioCatalogue = await apiData<CourseCatalogue>(page, "/api/courses/audio");
    const audioClassId = audioCatalogue.activeCourses?.[0]?.classificationId;
    expect(audioClassId, "The active account needs an audio course").toBeTruthy();
    const audioCourse = await apiData<MediaCourse>(page, `/api/audio/${encodeURIComponent(audioClassId!)}`);
    const audioLesson = firstLesson(audioCourse);
    expect(audioLesson.sourceUrl).toBeTruthy();
    await probeRangeSupport(request, audioLesson.sourceUrl!, "audio");
  });

  test("renewal links match normalized backend CTAs and approved hosts", async ({ page }) => {
    await signInSuccessfully(page, accountFor("expired"));
    const dashboard = await apiData<{ renewal?: { buttons?: Array<{ label?: string; url?: string }> } }>(page, "/api/dashboard");
    const buttons = dashboard.renewal?.buttons || [];
    expect(buttons.length).toBeGreaterThan(0);
    const hosts = expectedHosts("E2E_EXPECTED_RENEWAL_HOSTS");

    await page.goto("/dashboard");
    for (const button of buttons) {
      const url = new URL(button.url || "");
      expect(url.protocol).toBe("https:");
      expect(hosts).toContain(url.hostname.toLowerCase());
      await expect(page.getByRole("link", { name: button.label || "" })).toHaveAttribute("href", button.url || "");
    }
  });

  test("Resources responses are normalized with safe external URLs", async ({ page }) => {
    await signInSuccessfully(page, accountFor("active"));
    const catalogue = await apiData<ResourceCatalogue>(page, "/api/resources");
    const active = catalogue.categories?.find((category) => category.status === "active");
    expect(active?.courseId, "The active account needs an active Resource classification").toBeTruthy();
    const collection = await apiData<ResourceCollection>(page, `/api/resources/${encodeURIComponent(active!.courseId!)}`);

    for (const resource of collection.resources || []) {
      if (!resource.url) continue;
      expect(["http:", "https:"]).toContain(new URL(resource.url).protocol);
    }

  });

  test("Contract Forms enforce eligibility and match the configured Shopify catalog", async ({ page, request }) => {
    await signInSuccessfully(page, accountFor("contractFormsIneligible"));
    expect((await page.request.get("/api/contract-forms")).status()).toBe(403);

    await signInSuccessfully(page, accountFor("contractFormsEligible"));
    const catalog = await apiData<ContractFormsPayload>(page, "/api/contract-forms");
    const products = catalog.products || [];
    expect(products.length).toBeGreaterThan(0);
    const checkoutBaseUrl = new URL(catalog.checkoutBaseUrl || "");
    expect(expectedHosts("E2E_EXPECTED_SHOPIFY_HOST")).toContain(checkoutBaseUrl.hostname.toLowerCase());

    for (const product of products) {
      expect(product.variantId).toMatch(/^\d+$/);
      expect(product.price).toBeGreaterThan(0);
      const variantUrl = new URL(`/variants/${product.variantId}.js`, checkoutBaseUrl.origin);
      const response = await request.get(variantUrl.toString(), { timeout: 20_000 });
      expect(response.status(), `Shopify variant ${product.id} should exist`).toBe(200);
      const variant = await response.json() as { price?: number | string };
      const remoteCents = Number(variant.price);
      expect(remoteCents, `Shopify variant ${product.id} price should match`).toBe(Math.round(product.price! * 100));
    }

    await page.goto("/contract-forms");
    await page.getByRole("button", { name: "Add to Cart" }).first().click();
    const checkout = page.getByRole("link", { name: "Checkout" });
    await expect(checkout).toBeVisible();
    const href = await checkout.getAttribute("href");
    expect(new URL(href || "").hostname).toBe(checkoutBaseUrl.hostname);
  });
});

test("@staging Resources recommendation and report reach Contractor API", async ({ page }) => {
  requireAccounts(["active"]);
  await signInSuccessfully(page, accountFor("active"));
  const catalogue = await apiData<ResourceCatalogue>(page, "/api/resources");
  const active = catalogue.categories?.find((category) => category.status === "active");
  expect(active?.courseId).toBeTruthy();
  const collection = await apiData<ResourceCollection>(page, `/api/resources/${encodeURIComponent(active!.courseId!)}`);
  const resource = collection.resources?.[0];
  expect(resource?.id, "The active account needs a reportable Resource link").toBeTruthy();

  const unsafe = await page.request.post(`/api/resources/${encodeURIComponent(active!.courseId!)}/recommend`, {
    data: { comment: "Deployed validation probe", link: "javascript:alert(1)" },
  });
  expect(unsafe.status()).toBe(422);
  const tooLong = await page.request.post(`/api/resources/${encodeURIComponent(active!.courseId!)}/recommend`, {
    data: { comment: "x".repeat(2001), link: "https://example.com/resource" },
  });
  expect(tooLong.status()).toBe(422);

  const recommendation = await page.request.post(`/api/resources/${encodeURIComponent(active!.courseId!)}/recommend`, {
    data: {
      comment: "CIS Student staging integration verification",
      link: "https://example.com/cis-student-staging-smoke",
    },
  });
  expect(recommendation.status()).toBe(200);

  const report = await page.request.post(`/api/resources/${encodeURIComponent(active!.courseId!)}/report/${encodeURIComponent(resource!.id!)}`, {
    data: {
      comment: "CIS Student staging integration verification; no production action required.",
      issue: "Other",
    },
  });
  expect(report.status()).toBe(200);
});
