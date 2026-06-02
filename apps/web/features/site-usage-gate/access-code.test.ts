import { describe, expect, it } from "vitest";
import { normalizeSiteUsageInviteCode } from "./access-code";

describe("site usage invite code", () => {
  it("normalizes visitor input to uppercase trimmed code", () => {
    expect(normalizeSiteUsageInviteCode("  demo-code  ")).toBe("DEMO-CODE");
    expect(normalizeSiteUsageInviteCode("Demo-Code")).toBe("DEMO-CODE");
  });
});
