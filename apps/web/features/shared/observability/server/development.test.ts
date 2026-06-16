import { describe, expect, it } from "vitest";

import { isDevelopmentObservabilityAvailable } from "./development";

describe("development observability availability", () => {
  it("is available only for local Next.js development", () => {
    expect(
      isDevelopmentObservabilityAvailable({
        NODE_ENV: "development",
      })
    ).toBe(true);

    expect(
      isDevelopmentObservabilityAvailable({
        NODE_ENV: "development",
        VERCEL_ENV: "development",
      })
    ).toBe(true);

    expect(
      isDevelopmentObservabilityAvailable({
        NODE_ENV: "production",
      })
    ).toBe(false);

    expect(
      isDevelopmentObservabilityAvailable({
        NODE_ENV: "test",
      })
    ).toBe(false);

    expect(
      isDevelopmentObservabilityAvailable({
        NODE_ENV: "development",
        VERCEL_ENV: "preview",
      })
    ).toBe(false);

    expect(
      isDevelopmentObservabilityAvailable({
        NODE_ENV: "development",
        VERCEL_TARGET_ENV: "staging",
      })
    ).toBe(false);
  });
});
