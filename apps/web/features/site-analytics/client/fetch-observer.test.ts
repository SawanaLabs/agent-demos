import { describe, expect, it, vi } from "vitest";

import { acceptedDemoActionHeader } from "../shared/demo-action-contract";
import { createAcceptedDemoActionFetchObserver } from "./fetch-observer";

describe("accepted demo action fetch observer", () => {
  it("tracks one bounded action from one accepted response", async () => {
    const response = Response.json(
      { ok: true },
      {
        headers: {
          [acceptedDemoActionHeader]: "foundation-chat:send_message",
        },
      }
    );
    const fetchImplementation = vi.fn(async () => response);
    const track = vi.fn();
    const observedFetch = createAcceptedDemoActionFetchObserver({
      fetchImplementation: fetchImplementation as typeof fetch,
      track,
    });

    const result = await observedFetch("/api/demos/foundation-chat");

    expect(result).toBe(response);
    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith({
      action: "send_message",
      demo_slug: "foundation-chat",
    });
  });

  it("ignores missing, malformed, and out-of-catalog response metadata", async () => {
    const track = vi.fn();
    const responses = [
      Response.json({ ok: true }),
      Response.json(
        { ok: true },
        { headers: { [acceptedDemoActionHeader]: "missing-separator" } }
      ),
      Response.json(
        { ok: true },
        { headers: { [acceptedDemoActionHeader]: "private-demo:send_message" } }
      ),
    ];
    const fetchImplementation = vi.fn(async () => {
      const response = responses.shift();

      if (!response) {
        throw new Error("Missing test response.");
      }

      return response;
    });
    const observedFetch = createAcceptedDemoActionFetchObserver({
      fetchImplementation: fetchImplementation as typeof fetch,
      track,
    });

    await observedFetch("/first");
    await observedFetch("/second");
    await observedFetch("/third");

    expect(track).not.toHaveBeenCalled();
  });

  it("preserves accepted responses when the analytics adapter fails", async () => {
    const response = Response.json(
      { ok: true },
      {
        headers: {
          [acceptedDemoActionHeader]: "trace-eval-agent:evaluate",
        },
      }
    );
    const observedFetch = createAcceptedDemoActionFetchObserver({
      fetchImplementation: vi.fn(async () => response) as typeof fetch,
      track: () => {
        throw new Error("analytics unavailable");
      },
    });

    await expect(
      observedFetch("/api/demos/trace-eval-agent/evaluate")
    ).resolves.toBe(response);
  });
});
