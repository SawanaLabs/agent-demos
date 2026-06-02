import { describe, expect, it } from "vitest";

import { dynamic } from "./page";

describe("mcp-agent page", () => {
  it("renders dynamically so setup state matches runtime API configuration", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});
