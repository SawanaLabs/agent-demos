import { streamText } from "ai";
import { afterEach, expect, it, vi } from "vitest";
import { initialGraph } from "../model/graph";
import { handleCanvasChat } from "./handler";

vi.mock("ai", async (original) => ({
  ...(await original<typeof import("ai")>()),
  streamText: vi.fn(() => ({
    toUIMessageStream: () => new ReadableStream({ start: (c) => c.close() }),
  })),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("preserves completed tools across turns while excluding interrupted calls", async () => {
  vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
  vi.stubEnv("AI_GATEWAY_CHAT_MODEL", "");
  const response = await handleCanvasChat(
    new Request("http://localhost/chat", {
      method: "POST",
      body: JSON.stringify({
        graph: initialGraph(),
        messages: [
          {
            id: "a",
            role: "assistant",
            parts: [
              {
                type: "tool-readWorkflow",
                toolCallId: "interrupted",
                state: "input-streaming",
                input: {},
              },
              {
                type: "tool-runWorkflow",
                toolCallId: "run-1",
                state: "output-available",
                input: { target: "visual" },
                output: { failedNodeId: "visual", error: "生成失败" },
              },
            ],
          },
          { id: "b", role: "user", parts: [{ type: "text", text: "重试" }] },
        ],
      }),
    })
  );
  await response.text();
  expect(vi.mocked(streamText).mock.calls[0]?.[0]).toMatchObject({
    model: { modelId: "openai/gpt-5.6-luna" },
    providerOptions: { openai: { reasoningEffort: "medium" } },
  });
  const messages = vi.mocked(streamText).mock.calls[0]?.[0].messages;
  expect(JSON.stringify(messages)).not.toContain("interrupted");
  expect(messages).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        role: "assistant",
        content: expect.arrayContaining([
          expect.objectContaining({
            type: "tool-call",
            toolCallId: "run-1",
            input: { target: "visual" },
          }),
        ]),
      }),
      expect.objectContaining({
        role: "tool",
        content: expect.arrayContaining([
          expect.objectContaining({
            type: "tool-result",
            toolCallId: "run-1",
            output: {
              type: "json",
              value: { failedNodeId: "visual", error: "生成失败" },
            },
          }),
        ]),
      }),
    ])
  );
});
