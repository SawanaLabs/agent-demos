import { Chat } from "@ai-sdk/react";
import { type ChatStatus, DefaultChatTransport } from "ai";
import { describe, expect, it } from "vitest";

import { createDemoChat, isDemoChatBusyStatus } from "./use-demo-chat";

describe("demo chat controller", () => {
  it("creates an AI SDK chat for a demo API endpoint", () => {
    const chat = createDemoChat({ api: "/api/demos/foundation-chat" });
    const runtimeChat = chat as unknown as {
      transport: { api: string };
    };

    expect(chat).toBeInstanceOf(Chat);
    expect(runtimeChat.transport).toBeInstanceOf(DefaultChatTransport);
    expect(runtimeChat.transport.api).toBe("/api/demos/foundation-chat");
  });

  it("treats only submitted and streaming statuses as busy", () => {
    const busyStatuses: ChatStatus[] = ["submitted", "streaming"];

    expect(busyStatuses.every(isDemoChatBusyStatus)).toBe(true);
    expect(isDemoChatBusyStatus("ready")).toBe(false);
    expect(isDemoChatBusyStatus("error")).toBe(false);
  });
});
