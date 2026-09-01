export type DeviceAccessState =
  | "verified"
  | "register"
  | "limit_reached"
  | "unavailable";

export type DashboardAppSettings = {
  deviceLimitMessage: string;
  maintenance: { description: string; title: string } | null;
  registerDeviceMessage: string;
};

export type RenewalCheckoutButton = {
  label: string;
  sku: string | null;
  type: string | null;
  url: string;
};

export type RenewalCheckoutCtas = {
  buttons: RenewalCheckoutButton[];
  expiresAt: string | null;
  extensionDate: string | null;
  reEnrollmentDate: string | null;
  type: string | null;
};

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? value as UnknownRecord : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function enabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function safeHttpUrl(value: unknown): string {
  const candidate = text(value);
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

export function normalizeDashboardApp(value: unknown): DashboardAppSettings {
  const app = record(value);
  const websiteNotice = enabled(app.website_live) && text(app.website_live_title)
    ? { title: text(app.website_live_title), description: text(app.website_live_description) }
    : null;
  const playbackNotice = enabled(app.student_live_login) && text(app.student_live_login_title)
    ? { title: text(app.student_live_login_title), description: text(app.student_live_login_description) }
    : null;
  return {
    deviceLimitMessage: text(app.no_more_device_message) || "This account has reached its personal-device limit. Contact CIS for help.",
    maintenance: websiteNotice || playbackNotice,
    registerDeviceMessage: text(app.register_device_message) || "Register this browser as one of your personal devices to continue.",
  };
}

export function normalizeDeviceAccess(value: unknown): DeviceAccessState {
  const type = text(record(value).type);
  if (type === "verified-fingerprint") return "verified";
  if (type === "register-new-device") return "register";
  if (type === "3-device-registered") return "limit_reached";
  return "unavailable";
}

function unwrapRenewal(value: unknown): UnknownRecord {
  const payload = record(value);
  if (payload.renewal_checkout_ctas && typeof payload.renewal_checkout_ctas === "object") {
    return record(payload.renewal_checkout_ctas);
  }
  if (payload.renewalCheckoutCtas && typeof payload.renewalCheckoutCtas === "object") {
    return record(payload.renewalCheckoutCtas);
  }
  if (payload.data && typeof payload.data === "object") return unwrapRenewal(payload.data);
  return payload;
}

export function normalizeRenewalCheckoutCtas(value: unknown): RenewalCheckoutCtas {
  const ctas = unwrapRenewal(value);
  const buttons = Array.isArray(ctas.buttons)
    ? ctas.buttons.flatMap((value): RenewalCheckoutButton[] => {
        const button = record(value);
        const url = safeHttpUrl(button.url);
        const label = text(button.label);
        if (!url || !label) return [];
        return [{
          label,
          sku: text(button.sku) || null,
          type: text(button.type) || text(ctas.type) || null,
          url,
        }];
      })
    : [];

  return {
    buttons,
    expiresAt: text(ctas.expires_at) || text(ctas.expiresAt) || text(ctas.expires_on) || text(ctas.expiresOn) || text(ctas.expiration_date) || text(ctas.expirationDate) || text(ctas.extension_date) || text(ctas.extensionDate) || null,
    extensionDate: text(ctas.extension_date) || text(ctas.extensionDate) || null,
    reEnrollmentDate: text(ctas.re_enrollment_date) || text(ctas.reEnrollmentDate) || null,
    type: text(ctas.type) || null,
  };
}
