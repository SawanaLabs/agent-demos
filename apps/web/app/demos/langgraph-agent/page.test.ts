import { describe, expect, it } from "vitest";

import { dynamic } from "./page";

describe("langgraph-agent page", () => {
  it("renders dynamically so remote setup state matches runtime configuration", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});
