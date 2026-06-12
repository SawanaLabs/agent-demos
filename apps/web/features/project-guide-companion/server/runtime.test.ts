import type { UIMessage } from "ai";
import { describe, expect, it, vi } from "vitest";

import {
  getProjectGuideCompanionRuntimeState,
  handleProjectGuideCompanionRequest,
} from "./runtime";

function createMessage(input: {
  createdAt: string;
  id: string;
  role: "assistant" | "user";
  text: string;
}): UIMessage {
  return {
    id: input.id,
    metadata: {
      createdAt: input.createdAt,
    },
    parts: [{ text: input.text, type: "text" }],
    role: input.role,
  };
}

describe("project guide companion runtime", () => {
  it("surfaces setup state without requiring a request", () => {
    expect(
      getProjectGuideCompanionRuntimeState({
        AI_GATEWAY_API_KEY: "test-key",
      })
    ).toMatchObject({
      chatModel: "zai/glm-5",
      isChatAvailable: true,
      statusLabel: "Ready",
    });
  });

  it("returns setup errors before attempting model work", async () => {
    const streamProjectGuideCompanion = vi.fn();
    const response = await handleProjectGuideCompanionRequest(
      new Request("http://localhost/api/project-guide-companion", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      }),
      {},
      {
        streamProjectGuideCompanion,
      }
    );

    expect(response.status).toBe(500);
    expect(streamProjectGuideCompanion).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/AI_GATEWAY_API_KEY/i),
    });
  });

  it("validates and trims client-sent context before streaming", async () => {
    const streamProjectGuideCompanion = vi.fn(async (messages: UIMessage[]) =>
      Response.json({
        ids: messages.map((message) => message.id),
      })
    );
    const response = await handleProjectGuideCompanionRequest(
      new Request("http://localhost/api/project-guide-companion", {
        body: JSON.stringify({
          messages: [
            createMessage({
              createdAt: "2026-06-08T10:00:00.000Z",
              id: "old",
              role: "user",
              text: "Old context",
            }),
            createMessage({
              createdAt: "2026-06-08T11:58:00.000Z",
              id: "fresh",
              role: "user",
              text: "What is this project?",
            }),
          ],
          selectedChatModel: "openai/gpt-5-mini",
        }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
      },
      {
        clock: () => new Date("2026-06-08T12:00:00.000Z"),
        streamProjectGuideCompanion,
      }
    );

    expect(response.status).toBe(200);
    expect(streamProjectGuideCompanion).toHaveBeenCalledWith(
      [expect.objectContaining({ id: "fresh" })],
      expect.objectContaining({
        AI_GATEWAY_API_KEY: "test-key",
      }),
      "openai/gpt-5-mini"
    );
    await expect(response.json()).resolves.toEqual({ ids: ["fresh"] });
  });

  it("rejects unsupported selected companion models", async () => {
    const streamProjectGuideCompanion = vi.fn();
    const response = await handleProjectGuideCompanionRequest(
      new Request("http://localhost/api/project-guide-companion", {
        body: JSON.stringify({
          messages: [],
          selectedChatModel: "deepseek/deepseek-v4-flash",
        }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
      },
      {
        streamProjectGuideCompanion,
      }
    );

    expect(response.status).toBe(400);
    expect(streamProjectGuideCompanion).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/Unsupported selectedChatModel/i),
    });
  });
});
