import { describe, expect, it } from "vitest";

import { checkRegionHealth, createEveAgentTools, lookupService } from "./tools";

describe("eve agent tools", () => {
  it("resolves a known service to its region", () => {
    expect(lookupService("Billing")).toEqual({
      name: "billing",
      owner: "payments-team",
      region: "eu-west",
      tier: "tier-0",
    });
  });

  it("lists directory services for unknown names", () => {
    expect(lookupService("nope")).toEqual({
      error: expect.stringContaining("billing"),
    });
  });

  it("reports degraded health for eu-west", () => {
    expect(checkRegionHealth("eu-west")).toMatchObject({
      region: "eu-west",
      status: "degraded",
    });
  });

  it("errors for unknown regions", () => {
    expect(checkRegionHealth("moon")).toEqual({
      error: expect.stringContaining("moon"),
    });
  });

  it("exposes the two loop tools", () => {
    expect(Object.keys(createEveAgentTools()).sort()).toEqual([
      "check_region",
      "lookup_service",
    ]);
  });
});
