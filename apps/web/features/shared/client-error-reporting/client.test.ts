import { afterEach, describe, expect, it, vi } from "vitest";

import { reportClientException } from "./client";

describe("reportClientException", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports only allowlisted client exception metadata", async () => {
    const sendBeaconSpy = vi.fn(
      (_url: string, _data?: BodyInit | null) => true
    );
    const error = Object.assign(
      new Error("private@example.com token=secret-token"),
      {
        digest: "abc123",
      }
    );

    vi.stubGlobal("window", {
      location: {
        pathname: "/demos/private-user-path?token=secret-token",
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

    expect(sendBeaconSpy).toHaveBeenCalledOnce();

    const [url, blob] = sendBeaconSpy.mock.calls[0] ?? [];

    expect(url).toBe("/api/client-errors");
    const body = await (blob as Blob).text();

    expect(JSON.parse(body)).toEqual({
      kind: "route_error",
      source: "app-error-boundary",
    });
    expect(body).not.toMatch(
      /private@example\.com|secret-token|message|path|stack/u
    );
  });

  it("never sends a framework digest through the client transport", async () => {
    const sendBeaconSpy = vi.fn(
      (_url: string, _data?: BodyInit | null) => true
    );
    const error = Object.assign(new Error("malformed digest"), {
      digest: "secret_access_token_123",
    });

    vi.stubGlobal("window", {
      location: { pathname: "/digest-boundary" },
    });
    vi.stubGlobal("navigator", { sendBeacon: sendBeaconSpy });

    reportClientException({
      error,
      kind: "global_error",
      source: "app-global-error-boundary",
    });

    const [, blob] = sendBeaconSpy.mock.calls[0] ?? [];
    const body = await (blob as Blob).text();

    expect(JSON.parse(body)).toEqual({
      kind: "global_error",
      source: "app-global-error-boundary",
    });
    expect(body).not.toMatch(/digest|secret_access_token_123/u);
  });

  it("falls back from beacon failure and swallows synchronous transport errors", () => {
    const fetchSpy = vi.fn(() => {
      throw new Error("fetch unavailable");
    });
    const sendBeaconSpy = vi.fn(() => {
      throw new Error("beacon unavailable");
    });

    vi.stubGlobal("window", {
      location: { pathname: "/transport-failure" },
    });
    vi.stubGlobal("navigator", { sendBeacon: sendBeaconSpy });
    vi.stubGlobal("fetch", fetchSpy);

    expect(() =>
      reportClientException({
        error: new Error("transport failure"),
        kind: "route_error",
        source: "app-error-boundary",
      })
    ).not.toThrow();
    expect(sendBeaconSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("uses fetch when sendBeacon declines the payload", () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response(null)));
    const sendBeaconSpy = vi.fn(() => false);

    vi.stubGlobal("window", {
      location: { pathname: "/beacon-declined" },
    });
    vi.stubGlobal("navigator", { sendBeacon: sendBeaconSpy });
    vi.stubGlobal("fetch", fetchSpy);

    reportClientException({
      error: new Error("beacon declined"),
      kind: "route_error",
      source: "app-error-boundary",
    });

    expect(sendBeaconSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledOnce();
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
