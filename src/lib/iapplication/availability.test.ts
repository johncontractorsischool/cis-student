import { describe, expect, it } from "vitest";

import { classifyIApplicationAvailability } from "./availability";
import type { IApplicationActionCenter, IApplicationOverview } from "./types";

const linkedOverview: IApplicationOverview = {
  customer: {},
  iapplication_link: { status: "verified" },
  live_dashboard: null,
  synced_applications: [],
};

const linkedActions: IApplicationActionCenter = {
  applications: [],
  customer_id: 1,
  linked: true,
  primary_action: null,
  source_student_found: true,
};

describe("iApplication availability", () => {
  it("keeps partial successful data available", () => {
    expect(classifyIApplicationAvailability({
      actionCenter: linkedActions,
      failedStatuses: [503, null],
      overview: null,
    })).toBe("available");
  });

  it("distinguishes unlinked, missing, and unavailable responses", () => {
    expect(classifyIApplicationAvailability({
      actionCenter: { ...linkedActions, linked: false },
      failedStatuses: [],
      overview: null,
    })).toBe("not_linked");
    expect(classifyIApplicationAvailability({
      actionCenter: null,
      failedStatuses: [404, 404],
      overview: null,
    })).toBe("not_found");
    expect(classifyIApplicationAvailability({
      actionCenter: null,
      failedStatuses: [403, 503],
      overview: null,
    })).toBe("unavailable");
  });

  it("treats an overview without a link as unlinked", () => {
    expect(classifyIApplicationAvailability({
      actionCenter: null,
      failedStatuses: [],
      overview: { ...linkedOverview, iapplication_link: null },
    })).toBe("not_linked");
  });
});
