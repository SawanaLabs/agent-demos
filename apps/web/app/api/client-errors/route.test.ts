import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

describe("client error reporting route", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("records a sanitized client exception in runtime logs", async () => {
    const response = await POST(
      new Request("http://localhost/api/client-errors", {
        body: JSON.stringify({
          digest: "abc123",
          kind: "route_error",
          message: "ChunkLoadError: Loading chunk failed.",
          path: "/demos/ultra-chatbot-agent",
          source: "app-error-boundary",
          stack: "ChunkLoadError: Loading chunk failed.\n    at app.js:1:1",
        }),
        headers: {
          "content-type": "application/json",
          "user-agent": "Vitest Browser",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(204);
    expect(consoleErrorSpy).toHaveBeenCalledOnce();

    const logPayload = JSON.parse(
      consoleErrorSpy.mock.calls[0]?.[0] as string
    ) as Record<string, unknown>;

    expect(logPayload).toMatchObject({
      digest: "abc123",
      event: "client_exception",
      kind: "route_error",
      message: "ChunkLoadError: Loading chunk failed.",
      path: "/demos/ultra-chatbot-agent",
      source: "app-error-boundary",
      userAgent: "Vitest Browser",
    });
    expect(logPayload.stack).toContain("ChunkLoadError");
  });

  it("rejects invalid event kinds without writing an error log", async () => {
    const response = await POST(
      new Request("http://localhost/api/client-errors", {
        body: JSON.stringify({
          kind: "not_found",
          message: "Missing page",
          path: "/missing",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid client error report.",
      ok: false,
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
