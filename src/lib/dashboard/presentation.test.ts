import { describe, expect, it } from "vitest";

import { normalizeDashboardApp, normalizeDeviceAccess, normalizeRenewalCheckoutCtas } from "./presentation";

describe("dashboard release presentation", () => {
  it("normalizes the three backend device states", () => {
    expect(normalizeDeviceAccess({ type: "verified-fingerprint" })).toBe("verified");
    expect(normalizeDeviceAccess({ type: "register-new-device" })).toBe("register");
    expect(normalizeDeviceAccess({ type: "3-device-registered" })).toBe("limit_reached");
    expect(normalizeDeviceAccess(null)).toBe("unavailable");
  });

  it("uses web maintenance copy and device messages", () => {
    expect(normalizeDashboardApp({ website_live: 1, website_live_title: "Notice", website_live_description: "Details", register_device_message: "Register", no_more_device_message: "Limit" })).toEqual({
      maintenance: { title: "Notice", description: "Details" },
      registerDeviceMessage: "Register",
      deviceLimitMessage: "Limit",
    });
  });

  it("unwraps renewal aliases and drops unsafe checkout URLs", () => {
    const result = normalizeRenewalCheckoutCtas({ data: { renewalCheckoutCtas: {
      type: "extension",
      extensionDate: "2026-09-01",
      buttons: [
        { label: "30 days", url: "https://checkout.example.com/extend" },
        { label: "Bad", url: "javascript:alert(1)" },
      ],
    } } });
    expect(result.type).toBe("extension");
    expect(result.extensionDate).toBe("2026-09-01");
    expect(result.buttons).toHaveLength(1);
  });
});
