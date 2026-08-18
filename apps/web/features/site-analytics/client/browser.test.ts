import { afterEach, describe, expect, it, vi } from "vitest";

const { sendGAEvent } = vi.hoisted(() => ({
  sendGAEvent: vi.fn(),
}));

vi.mock("@next/third-parties/google", () => ({ sendGAEvent }));

import { trackDemoAction } from "./browser";

const originalWindow = globalThis.window;

afterEach(() => {
  sendGAEvent.mockReset();

  if (originalWindow === undefined) {
    Reflect.deleteProperty(globalThis, "window");
  } else {
    globalThis.window = originalWindow;
  }
});

describe("browser analytics dispatcher", () => {
  it("stays a no-op without a loaded GA provider", () => {
    globalThis.window = {} as Window & typeof globalThis;

    trackDemoAction({
      action: "send_message",
      demo_slug: "image-workflow-agent",
    });

    expect(sendGAEvent).not.toHaveBeenCalled();
  });

  it("sends one demo_action through the loaded GA provider", () => {
    globalThis.window = {
      gtag: vi.fn(),
    } as unknown as Window & typeof globalThis;

    const event = {
      action: "run_workflow",
      demo_slug: "image-workflow-agent",
      has_reference_image: false,
      source: "agent",
    } as const;

    trackDemoAction(event);

    expect(sendGAEvent).toHaveBeenCalledOnce();
    expect(sendGAEvent).toHaveBeenCalledWith("event", "demo_action", event);
  });

  it("isolates a throwing provider readiness getter", () => {
    const blockedWindow = {};

    Object.defineProperty(blockedWindow, "gtag", {
      get: () => {
        throw new Error("provider blocked");
      },
    });
    globalThis.window = blockedWindow as Window & typeof globalThis;

    expect(() =>
      trackDemoAction({
        action: "send_message",
        demo_slug: "image-workflow-agent",
      })
    ).not.toThrow();
    expect(sendGAEvent).not.toHaveBeenCalled();
  });
});
