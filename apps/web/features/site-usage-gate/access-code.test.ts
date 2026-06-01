import { describe, expect, it } from "vitest";
import { normalizeSiteUsageInviteCode } from "./access-code";

describe("site usage invite code", () => {
  it("normalizes visitor input to uppercase trimmed code", () => {
    expect(normalizeSiteUsageInviteCode("  sawana  ")).toBe("SAWANA");
    expect(normalizeSiteUsageInviteCode("SawAna")).toBe("SAWANA");
  });
});
