import { afterEach, describe, expect, it, vi } from "vitest";

const { getContext } = vi.hoisted(() => ({ getContext: vi.fn(() => ({})) }));

vi.mock("@vercel/oidc", () => ({ getContext }));

import { keys } from "./keys";

afterEach(() => {
  vi.unstubAllEnvs();
  getContext.mockReset();
  getContext.mockReturnValue({});
});

describe("Sandbox OIDC runtime credentials", () => {
  it("uses the current request token before the build environment token", () => {
    vi.stubEnv("VERCEL_OIDC_TOKEN", "build-token");
    getContext.mockReturnValue({
      headers: { "x-vercel-oidc-token": "request-token" },
    });

    expect(keys().VERCEL_OIDC_TOKEN).toBe("request-token");
  });

  it("keeps local environment credentials available", () => {
    vi.stubEnv("VERCEL_OIDC_TOKEN", "local-token");

    expect(keys().VERCEL_OIDC_TOKEN).toBe("local-token");
  });
});
