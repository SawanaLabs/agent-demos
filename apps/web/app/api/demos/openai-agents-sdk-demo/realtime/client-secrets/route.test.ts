import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createMeteredDemoRoute: vi.fn(
    (options) => (request: Request, context: unknown) =>
      options.handler({ context, request })
  ),
  handleClientSecretRequest: vi.fn(async () => Response.json({ ok: true })),
}));

vi.mock("@/features/site-usage-gate/server/metered-demo-route", () => ({
  createMeteredDemoRoute: mocks.createMeteredDemoRoute,
}));

vi.mock("@/features/openai-agents-sdk-demo/server/voice-realtime", () => ({
  handleOpenAiAgentsSdkDemoVoiceClientSecretRequest:
    mocks.handleClientSecretRequest,
}));

describe("OpenAI Agents SDK realtime client-secret route", () => {
  it("meters client-secret minting as a demo message usage", async () => {
    const { POST } = await import("./route");
    const request = new Request(
      "http://localhost/api/demos/openai-agents-sdk-demo/realtime/client-secrets",
      {
        method: "POST",
      }
    );

    const response = await POST(request, undefined);

    expect(response.status).toBe(200);
    expect(mocks.createMeteredDemoRoute).toHaveBeenCalledWith({
      action: "send_message",
      demoSlug: "openai-agents-sdk-demo",
      handler: expect.any(Function),
    });
    expect(mocks.handleClientSecretRequest).toHaveBeenCalledWith(request);
  });
});
