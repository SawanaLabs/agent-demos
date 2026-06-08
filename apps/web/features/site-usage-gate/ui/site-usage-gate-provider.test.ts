import { describe, expect, it } from "vitest";

import { shouldHandleSiteUsageLimitPath } from "./site-usage-gate-provider";

describe("shouldHandleSiteUsageLimitPath", () => {
  it("handles demo routes and the site-owned project guide companion route", () => {
    expect(shouldHandleSiteUsageLimitPath("/api/demos/mcp-agent")).toBe(true);
    expect(shouldHandleSiteUsageLimitPath("/api/project-guide-companion")).toBe(
      true
    );
    expect(shouldHandleSiteUsageLimitPath("/api/site-usage/waitlist")).toBe(
      false
    );
  });
});
