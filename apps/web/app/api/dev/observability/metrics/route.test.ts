import { afterEach, describe, expect, it } from "vitest";

import { GET } from "./route";

const originalEnv = { ...process.env };

describe("development observability metrics route", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("serves Prometheus text only in local development", async () => {
    process.env = {
      ...process.env,
      NODE_ENV: "development",
    };
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_TARGET_ENV;

    const developmentResponse = await GET();

    expect(developmentResponse.status).toBe(200);
    expect(developmentResponse.headers.get("content-type")).toContain(
      "text/plain"
    );
    await expect(developmentResponse.text()).resolves.toContain(
      "dev_observability_harness_info"
    );

    process.env = {
      ...process.env,
      NODE_ENV: "production",
      VERCEL_ENV: "production",
    };

    const productionResponse = await GET();

    expect(productionResponse.status).toBe(404);
    await expect(productionResponse.json()).resolves.toEqual({
      error:
        "Development observability metrics are only available during local development.",
      ok: false,
    });
  });
});
