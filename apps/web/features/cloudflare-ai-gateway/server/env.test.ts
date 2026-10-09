import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("Image gateway configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("loads Vercel without validating inactive Cloudflare authentication configuration", async () => {
    vi.stubEnv("IMAGE_GATEWAY", "vercel");
    vi.stubEnv("AI_GATEWAY_API_KEY", "vercel-secret");
    vi.stubEnv("CLOUDFLARE_AI_GATEWAY_AUTH_MODE", "invalid-mode");

    const { getGatewaySetup, getImageGeneratorConfig } = await import("./env");
    expect(getGatewaySetup()).toMatchObject({
      gateway: "vercel",
      authMode: "gateway-managed",
      missing: [],
      models: [
        { id: "gpt-image-2", available: true, missing: [] },
        { id: "gemini-3.1-flash-image", available: true, missing: [] },
      ],
    });
    expect(getImageGeneratorConfig("gpt-image-2")).toEqual({
      gateway: "vercel",
      apiKey: "vercel-secret",
    });
  });

  it("rejects invalid Cloudflare authentication when Cloudflare is selected", async () => {
    vi.stubEnv("IMAGE_GATEWAY", "cloudflare");
    vi.stubEnv("CLOUDFLARE_AI_GATEWAY_AUTH_MODE", "invalid-mode");

    await expect(import("./env")).rejects.toThrow(
      "Invalid environment variables"
    );
  });
});
