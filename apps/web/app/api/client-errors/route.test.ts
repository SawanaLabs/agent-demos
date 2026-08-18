import { beforeEach, describe, expect, it, vi } from "vitest";

const { logRuntimeError } = vi.hoisted(() => ({
  logRuntimeError: vi.fn(() => "error-123"),
}));

vi.mock("@/features/site-runtime-logging/server/server-logger", () => ({
  runtimeErrorLogger: {
    error: logRuntimeError,
  },
}));

import { runtimeErrorEvents } from "@/features/site-runtime-logging/server/events";
import { POST } from "./route";

function createRequest(
  body: Record<string, unknown> | string,
  headers: Record<string, string> = {}
) {
  const serializedBody = typeof body === "string" ? body : JSON.stringify(body);

  return new Request("http://localhost/api/client-errors", {
    body: serializedBody,
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    method: "POST",
  });
}

describe("client error reporting route", () => {
  beforeEach(() => {
    logRuntimeError.mockClear();
  });

  it("maps allowlisted client metadata into one structured runtime error", async () => {
    const response = await POST(
      createRequest({
        kind: "route_error",
        source: "app-error-boundary",
      })
    );

    expect(response.status).toBe(204);
    expect(logRuntimeError).toHaveBeenCalledOnce();
    expect(logRuntimeError).toHaveBeenCalledWith(
      runtimeErrorEvents.clientRuntimeFailed,
      {
        client_error_kind: "route_error",
        failure_category: "runtime",
        operation: "client_render",
        source: "app_error_boundary",
      }
    );
  });

  it("rejects raw client error content without writing it", async () => {
    const response = await POST(
      createRequest({
        digest: "secret_access_token_123",
        kind: "route_error",
        message: "private@example.com token=secret-token",
        path: "/private?token=secret-token",
        source: "app-error-boundary",
        stack: "Error: private@example.com token=secret-token",
      })
    );

    expect(response.status).toBe(400);
    expect(logRuntimeError).not.toHaveBeenCalled();
  });

  it("rejects missing or cross-origin browser metadata", async () => {
    const missingMetadata = await POST(
      createRequest(
        { kind: "route_error", source: "app-error-boundary" },
        { origin: "", "sec-fetch-site": "" }
      )
    );
    const crossOrigin = await POST(
      createRequest(
        { kind: "route_error", source: "app-error-boundary" },
        { origin: "https://attacker.example", "sec-fetch-site": "cross-site" }
      )
    );

    expect(missingMetadata.status).toBe(403);
    expect(crossOrigin.status).toBe(403);
    expect(logRuntimeError).not.toHaveBeenCalled();
  });

  it("rejects non-JSON and oversized reports", async () => {
    const nonJson = await POST(
      createRequest(
        { kind: "route_error", source: "app-error-boundary" },
        { "content-type": "text/plain" }
      )
    );
    const oversized = await POST(
      createRequest(JSON.stringify({ padding: "x".repeat(600) }))
    );

    expect(nonJson.status).toBe(415);
    expect(oversized.status).toBe(413);
    expect(logRuntimeError).not.toHaveBeenCalled();
  });

  it("rejects invalid event kinds without writing an error log", async () => {
    const response = await POST(
      createRequest({
        kind: "not_found",
        source: "app-error-boundary",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid client error report.",
      ok: false,
    });
    expect(logRuntimeError).not.toHaveBeenCalled();
  });

  it("limits accepted reports per client and returns a retry budget", async () => {
    const responses: Response[] = [];

    for (let index = 0; index < 6; index += 1) {
      responses.push(
        await POST(
          createRequest(
            {
              kind: "route_error",
              source: "app-error-boundary",
            },
            { "x-vercel-forwarded-for": "203.0.113.10" }
          )
        )
      );
    }

    expect(responses.slice(0, 5).map((response) => response.status)).toEqual([
      204, 204, 204, 204, 204,
    ]);
    expect(responses[5]?.status).toBe(429);
    expect(responses[5]?.headers.get("retry-after")).toBe("60");
    expect(logRuntimeError).toHaveBeenCalledTimes(5);
  });
});
