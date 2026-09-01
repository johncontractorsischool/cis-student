import sanitizeHtml from "sanitize-html";

import type { User } from "../api/types";

export type EntryPath = "/dashboard" | "/first-login";

export function needsFirstLogin(user: User | null | undefined): boolean {
  if (!user) return false;
  const firstTime = Number(user.firsttime);
  const agreementId = user.enrollment_agreements?.id;
  return firstTime !== 0 && firstTime !== 6 && agreementId != null && String(agreementId).trim() !== "";
}

export function entryPathForUser(user: User): EntryPath {
  return needsFirstLogin(user) ? "/first-login" : "/dashboard";
}

export function sanitizeAgreementHtml(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  return sanitizeHtml(value, {
    allowedTags: [
      "a", "b", "blockquote", "br", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6",
      "hr", "i", "li", "ol", "p", "small", "span", "strong", "sub", "sup", "table", "tbody",
      "td", "tfoot", "th", "thead", "tr", "u", "ul",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (_tag, attributes) => ({
        tagName: "a",
        attribs: {
          ...attributes,
          ...(attributes.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
        },
      }),
    },
  });
}
