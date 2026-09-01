import { normalizeRenewalCheckoutCtas } from "../dashboard/presentation";
import type {
  ResourceCatalogue,
  ResourceCategory,
  ResourceCollection,
  ResourceLink,
} from "./types";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? value as UnknownRecord : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function id(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function enabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function safeResourceUrl(value: unknown): string {
  const candidate = text(value);
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizeCategory(value: unknown, index: number): ResourceCategory | null {
  const item = record(value);
  const courseId = id(item.course_id);
  if (!courseId || courseId === "0") return null;

  const inactive = text(item.subscribed_class_status).toLowerCase() === "inactive";
  const expired = enabled(item.expired);
  return {
    courseId,
    expirationDate: text(item.expiration_date) || null,
    id: id(item.id) || `resource-${courseId}-${index}`,
    status: expired ? "expired" : inactive ? "inactive" : "active",
    title: text(item.name) || "Contractor resources",
  };
}

export function normalizeResourceCatalogue(payload: unknown, renewal?: unknown): ResourceCatalogue {
  const data = record(payload);
  const categories = Array.isArray(data.classes)
    ? data.classes.map(normalizeCategory).filter((item): item is ResourceCategory => item !== null)
    : [];

  return {
    categories,
    renewal: normalizeRenewalCheckoutCtas(renewal),
    type: data.type === "demo_resource" ? "demo_resource" : "resource",
  };
}

function normalizeLink(value: unknown, index: number): ResourceLink | null {
  const item = record(value);
  const resourceId = id(item.id);
  if (!resourceId) return null;
  return {
    description: text(item.Description),
    id: resourceId,
    organization: text(item.Organization),
    title: text(item.Title) || `Resource ${index + 1}`,
    url: safeResourceUrl(item.Link),
  };
}

export function normalizeResourceCollection(payload: unknown, classId: string): ResourceCollection {
  const data = record(payload);
  const classification = record(data.classification);
  const resources = Array.isArray(data.resources)
    ? data.resources.map(normalizeLink).filter((item): item is ResourceLink => item !== null)
    : [];

  return {
    classId,
    resources,
    title: text(classification.Class_description) || "Resources",
  };
}
