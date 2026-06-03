import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const getDomain = vi.fn();

  return {
    getDomain,
    getSharedSandboxAgentSessionRegistry: vi.fn(() => ({
      getDomain,
    })),
  };
});

vi.mock("@/features/sandbox-agent/server/session", () => ({
  getSharedSandboxAgentSessionRegistry:
    mocks.getSharedSandboxAgentSessionRegistry,
  SANDBOX_AGENT_PREVIEW_PORT: 3000,
}));

describe("Sandbox Agent preview-status route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.getDomain.mockReturnValue("https://sandbox-session.vercel.run");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("OK"))
    );
  });

  it("rejects preview URLs outside the current sandbox session origin", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/demos/sandbox-agent/preview-status?sessionId=chat-123&url=https%3A%2F%2Fattacker.example"
      )
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      errorCode: "PREVIEW_URL_NOT_ALLOWED",
      ok: false,
    });
    expect(mocks.getDomain).toHaveBeenCalledWith("chat-123", 3000);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches a matching sandbox preview origin with SSRF hardening", async () => {
    const previewUrl = "https://sandbox-session.vercel.run/index.html";
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response("DEPLOYMENT_NOT_READY", {
        headers: {
          "x-vercel-error": "DEPLOYMENT_NOT_READY",
        },
        status: 503,
        statusText: "Service Unavailable",
      })
    );

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        `http://localhost/api/demos/sandbox-agent/preview-status?sessionId=chat-123&url=${encodeURIComponent(
          previewUrl
        )}`
      )
    );
    const payload = await response.json();
    const fetchOptions = fetchMock.mock.calls[0]?.[1] as RequestInit;

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      errorCode: "DEPLOYMENT_NOT_READY",
      message: "DEPLOYMENT_NOT_READY",
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });
    expect(fetchMock.mock.calls[0]?.[0]).toEqual(new URL(previewUrl));
    expect(fetchOptions.cache).toBe("no-store");
    expect(fetchOptions.redirect).toBe("manual");
    expect(fetchOptions.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns not found when the sandbox session has no existing preview domain", async () => {
    mocks.getDomain.mockImplementationOnce(() => {
      throw new Error("missing sandbox handle");
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/demos/sandbox-agent/preview-status?sessionId=chat-404&url=https%3A%2F%2Fsandbox-session.vercel.run%2Findex.html"
      )
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      errorCode: "PREVIEW_SESSION_NOT_FOUND",
      ok: false,
    });
    expect(mocks.getDomain).toHaveBeenCalledWith("chat-404", 3000);
    expect(fetch).not.toHaveBeenCalled();
  });
});
