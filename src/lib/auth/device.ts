import "server-only";

import type { NextRequest, NextResponse } from "next/server";

const DEVICE_COOKIE = "cis_device_id";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function resolveDeviceId(request: NextRequest): string {
  const cookieId = request.cookies.get(DEVICE_COOKIE)?.value;
  if (cookieId && UUID_PATTERN.test(cookieId)) {
    return cookieId;
  }

  const fallbackId = request.headers.get("x-cis-device-id");
  return fallbackId && UUID_PATTERN.test(fallbackId)
    ? fallbackId
    : crypto.randomUUID();
}

export function persistDeviceId(response: NextResponse, deviceId: string): void {
  response.cookies.set(DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
