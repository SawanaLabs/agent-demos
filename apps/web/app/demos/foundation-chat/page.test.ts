import { describe, expect, it } from "vitest";

import { dynamic } from "./page";

describe("foundation-chat page", () => {
  it("renders dynamically so setup state matches runtime AI Gateway configuration", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});
