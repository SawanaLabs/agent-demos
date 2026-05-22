import { describe, expect, it } from "vitest";

import {
  getMultimodalChatbotRuntimeState,
  handleMultimodalChatbotRequest,
} from "./runtime";

const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY/i;

describe("multimodal chatbot runtime", () => {
  it("maps shared gateway setup into a multimodal-ready runtime state", () => {
    expect(
      getMultimodalChatbotRuntimeState({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1",
      })
    ).toEqual({
      acceptedMediaTypes: ["application/pdf", "image/*"],
      chatModel: "openai/gpt-4.1",
      isChatAvailable: true,
      nodeVersion: process.version,
      setupMessage: null,
      statusLabel: "Ready",
    });
  });

  it("keeps setup errors inside the multimodal runtime shape", () => {
    expect(getMultimodalChatbotRuntimeState({})).toMatchObject({
      isChatAvailable: false,
      setupMessage: expect.stringMatching(missingGatewayKeyPattern),
      statusLabel: "Setup required",
    });
  });

  it("returns a setup error before attempting multimodal chat work", async () => {
    const response = await handleMultimodalChatbotRequest(
      new Request("http://localhost/api/demos/multimodal-chatbot", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      }),
      {}
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingGatewayKeyPattern),
    });
  });

  it("rejects invalid request bodies at the runtime seam", async () => {
    const response = await handleMultimodalChatbotRequest(
      new Request("http://localhost/api/demos/multimodal-chatbot", {
        body: JSON.stringify({ prompt: "hello" }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        streamMultimodalChatbot: async () => Response.json({ ok: true }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Expected a JSON body with a "messages" array.',
    });
  });

  it("streams valid multimodal UI messages through the multimodal streamer", async () => {
    const response = await handleMultimodalChatbotRequest(
      new Request("http://localhost/api/demos/multimodal-chatbot", {
        body: JSON.stringify({
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: "What does this image show?",
                },
                {
                  filename: "diagram.png",
                  mediaType: "image/png",
                  type: "file",
                  url: "data:image/png;base64,ZmFrZQ==",
                },
              ],
            },
          ],
        }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        streamMultimodalChatbot: async (messages) =>
          Response.json({ messageCount: messages.length }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ messageCount: 1 });
  });

  it("rejects unsupported attachment media types with a client error", async () => {
    const response = await handleMultimodalChatbotRequest(
      new Request("http://localhost/api/demos/multimodal-chatbot", {
        body: JSON.stringify({
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [
                {
                  type: "text",
                  text: "Can you inspect this archive?",
                },
                {
                  filename: "archive.zip",
                  mediaType: "application/zip",
                  type: "file",
                  url: "data:application/zip;base64,ZmFrZQ==",
                },
              ],
            },
          ],
        }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        streamMultimodalChatbot: async () => Response.json({ ok: true }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Only image attachments and PDF attachments are supported.",
    });
  });
});
