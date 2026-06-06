import { afterEach, describe, expect, it, vi } from "vitest";

import { reportClientException } from "./client";

describe("reportClientException", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports a client exception with the current pathname only", async () => {
    const sendBeaconSpy = vi.fn(
      (_url: string, _data?: BodyInit | null) => true
    );

    vi.stubGlobal("window", {
      location: {
        pathname: "/demos/ultra-chatbot-agent",
      },
    });
    vi.stubGlobal("navigator", {
      sendBeacon: sendBeaconSpy,
    });

    reportClientException({
      error: new Error("ChunkLoadError: Loading chunk failed."),
      kind: "route_error",
      source: "app-error-boundary",
    });

    expect(sendBeaconSpy).toHaveBeenCalledOnce();

    const [url, blob] = sendBeaconSpy.mock.calls[0] ?? [];

    expect(url).toBe("/api/client-errors");
    await expect((blob as Blob).text()).resolves.toContain(
      '"path":"/demos/ultra-chatbot-agent"'
    );
  });

  it("deduplicates repeated reports for the same boundary error", () => {
    const sendBeaconSpy = vi.fn(
      (_url: string, _data?: BodyInit | null) => true
    );
    const error = new Error("ChunkLoadError: repeated test failure.");

    vi.stubGlobal("window", {
      location: {
        pathname: "/demos/ultra-chatbot-agent",
      },
    });
    vi.stubGlobal("navigator", {
      sendBeacon: sendBeaconSpy,
    });

    reportClientException({
      error,
      kind: "route_error",
      source: "app-error-boundary",
    });
    reportClientException({
      error,
      kind: "route_error",
      source: "app-error-boundary",
    });

    expect(sendBeaconSpy).toHaveBeenCalledOnce();
  });
});
