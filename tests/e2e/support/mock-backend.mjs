import http from "node:http";

const agreement = "<h2>Fixture enrollment agreement</h2><p>Review these terms before continuing.</p>";
let acceptedTokens = new Set();
let completedTokens = new Set();
let profiles = new Map();

function json(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(payload));
}

function data(response, value, message = "OK") {
  json(response, 200, { data: value, message });
}

async function body(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return {}; }
}

function tokenFrom(request) {
  return String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
}

function fixtureUser(token) {
  const firstLogin = token === "fixture-first-login" && !completedTokens.has(token);
  return {
    account_type: token === "fixture-delete" ? 3 : 1,
    address: "123 Main Street",
    city: "Sacramento",
    created_platform: token === "fixture-delete" ? 1 : 0,
    customerid: 100,
    demo_account: false,
    email: firstLogin ? "firstlogin@example.com" : "student@example.com",
    enrollment_agreements: firstLogin && !acceptedTokens.has(token) ? { id: 7, Agreement_body: agreement } : null,
    firsttime: firstLogin && !acceptedTokens.has(token) ? 1 : 0,
    iapp_access: 0,
    lang: "en",
    lname: "Student",
    mobilenum: "9165551212",
    name: "Fixture",
    state: "CA",
    zip: "95814",
    ...(profiles.get(token) || {}),
  };
}

function notFound(response) {
  json(response, 404, { error: { code: 404, message: "Fixture not found" } });
}

export function startMockBackend(port) {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    const path = url.pathname.replace(/^\/api\/v2/, "");
    const method = request.method || "GET";

    if (url.pathname === "/__reset") {
      acceptedTokens = new Set();
      completedTokens = new Set();
      profiles = new Map();
      return data(response, { reset: true });
    }
    if (path === "/auth/login" && method === "POST") {
      const input = await body(request);
      const token = input.email === "firstlogin@example.com" ? "fixture-first-login" : "fixture-active";
      return data(response, { token, expires_in: 3600, user: fixtureUser(token) });
    }
    if (path === "/auth/forgot-password" && method === "POST") {
      return data(response, {}, "Password recovery instructions sent.");
    }
    if (path.startsWith("/auth/refresh")) {
      return data(response, { token: url.searchParams.get("token") || "fixture-active", expires_in: 3600 });
    }

    const token = tokenFrom(request);
    if (!token && path !== "/app") return json(response, 401, { error: { code: 401, message: "Sign in required" } });

    if (path === "/account/me") return data(response, fixtureUser(token));
    if (path.startsWith("/account/accept-terms/") && method === "GET") {
      acceptedTokens.add(token);
      return data(response, fixtureUser(token));
    }
    if (path === "/account/first-login-prescreen" && method === "GET") return data(response, { show_modal: !completedTokens.has(token) });
    if (path === "/account/first-login-prescreen" && method === "POST") {
      completedTokens.add(token);
      return data(response, { created: true });
    }
    if (path === "/account/change-password" && method === "POST") return data(response, { updated: true });
    if (path === "/account/update-profile" && method === "POST") {
      const input = await body(request);
      profiles.set(token, { ...(profiles.get(token) || {}), ...input });
      return data(response, fixtureUser(token));
    }
    if (path === "/account/update-lang" && method === "POST") {
      const input = await body(request);
      profiles.set(token, { ...(profiles.get(token) || {}), lang: input.lang });
      return data(response, fixtureUser(token));
    }
    if (path === "/exam_attempt/reset" && method === "GET") return data(response, { reset: true });
    if (path === "/account/delete" && method === "POST") return data(response, { deleted: true });
    if (path === "/app") return data(response, {
      no_more_device_message: "Three devices are already registered.",
      register_device_message: "Register this browser to continue.",
      website_live: 0,
    });
    if (path.startsWith("/device/status/")) {
      if (token === "fixture-register") return data(response, { type: "register-new-device" });
      if (token === "fixture-limit") return data(response, { type: "3-device-registered" });
      return data(response, { type: "verified-fingerprint" });
    }
    if (path === "/device/register" && method === "POST") return data(response, { type: "verified-fingerprint" });
    if (path === "/upgrade-demo-text") return data(response, {});
    if (path === "/live_class_status") return data(response, { live_class_status: 0 });
    if (path === "/study_progress") return data(response, { law: { exams: { completed: 1, total: 4 }, videos: { completed: 2, total: 6 } }, trade: { exams: { completed: 0, total: 4 }, videos: { completed: 0, total: 6 } } });
    if (path === "/practice_test_classes/opt") return data(response, { type: "practice_test", classes: [{ id: 12, test_category_id: 4, name: "General Building", total_count: 3, completed_count: 1 }] });
    if (path === "/renewal-checkout-ctas") return data(response, { type: "renewal", expires_at: "2026-08-01", buttons: [{ label: "Renew 30 days", url: "https://checkout.example.com/renew" }] });
    if (path === "/iapplication/application-checklists") return data(response, { applications: [] });
    if (path.startsWith("/ai_forms/customers/")) return notFound(response);
    if (path === "/courses/video" || path === "/courses/audio") return data(response, { active_courses: [{ id: 1, clas_id: 12, completed_count: 1, total_count: 3, reading_classification: { id: 12, Class_code: "B", Class_description: "General Building" } }], expired_courses: [] });
    if (path === "/courses/reading") return data(response, { active_courses: [{ id: 1, reading_classification: { id: 44, Class_code: "LAW", Class_description: "Law and Business" } }] });
    if (path === "/reading_courses_with_detail/44") return data(response, { reading_courses: { category_1: { id: 1, title: "Getting started", chapters: { content_10: { id: 10, title: "Introduction", type: "content", read: false } } } }, reading_courses_contents: [{ id: 10, title: "Introduction", content: "<p>Welcome to the course.</p>" }] });
    if (path === "/live_classes_test") return data(response, { videos: [{ id: 1, Class_description: "General Building", live_class_videos: [{ id: 10, name: "Recorded class", status: "archive" }] }] });
    if (path === "/resource_classes") return data(response, { type: "resource", classes: [
      { id: 1, course_id: 11, name: "General Building" },
      { id: 2, course_id: 22, name: "Electrical", expired: true, expiration_date: "2026-08-01" },
      { id: 3, course_id: 33, name: "Plumbing", subscribed_class_status: "inactive" },
    ] });
    if (path === "/resources/11") return data(response, { classification: { Class_description: "General Building" }, resources: [{ id: 9, Title: "CSLB", Organization: "State of California", Description: "License information", Link: "https://www.cslb.ca.gov/" }] });
    if (path.startsWith("/recommend-resources/") && method === "POST") return data(response, {}, "Recommendation received.");
    if (path.startsWith("/report-resources/") && method === "POST") return data(response, {}, "Report received.");
    return notFound(response);
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}
