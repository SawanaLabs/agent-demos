import { describe, expect, it } from "vitest";

import {
  getContentReviewRuntimeState,
  handleContentReviewRequest,
} from "./runtime";

const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY/i;

describe("content review runtime", () => {
  it("maps shared gateway setup into a structured-review runtime state", () => {
    expect(
      getContentReviewRuntimeState({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1",
      })
    ).toEqual({
      acceptedMediaTypes: ["application/pdf", "image/*"],
      chatModel: "openai/gpt-4.1",
      isReviewAvailable: true,
      nodeVersion: process.version,
      setupMessage: null,
      statusLabel: "Ready",
    });
  });

  it("passes validated multimodal review input into the structured-output streamer", async () => {
    const response = await handleContentReviewRequest(
      new Request("http://localhost/api/demos/content-review", {
        body: JSON.stringify({
          attachments: [
            {
              filename: "policy.pdf",
              mediaType: "application/pdf",
              url: "data:application/pdf;base64,JVBERi0xLjQKJcfs...",
            },
          ],
          prompt: "Review this draft landing page copy for policy violations.",
        }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        streamContentReview: async (input) =>
          Response.json({
            attachmentCount: input.attachments.length,
            prompt: input.prompt,
          }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      attachmentCount: 1,
      prompt: "Review this draft landing page copy for policy violations.",
    });
  });

  it("returns a setup error before attempting structured review work", async () => {
    const response = await handleContentReviewRequest(
      new Request("http://localhost/api/demos/content-review", {
        body: JSON.stringify({
          prompt: "Review this copy.",
        }),
        method: "POST",
      }),
      {}
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingGatewayKeyPattern),
    });
  });

  it("rejects unsupported attachment media types with a client error", async () => {
    const response = await handleContentReviewRequest(
      new Request("http://localhost/api/demos/content-review", {
        body: JSON.stringify({
          attachments: [
            {
              filename: "archive.zip",
              mediaType: "application/zip",
              url: "data:application/zip;base64,UEsDBBQAAAAI",
            },
          ],
          prompt: "Review this submission.",
        }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        streamContentReview: async () => Response.json({ ok: true }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Only image attachments and PDF attachments are supported.",
    });
  });

  it("requires either review text or at least one attachment", async () => {
    const response = await handleContentReviewRequest(
      new Request("http://localhost/api/demos/content-review", {
        body: JSON.stringify({
          attachments: [],
          prompt: "   ",
        }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        streamContentReview: async () => Response.json({ ok: true }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Provide review text, at least one attachment, or both.",
    });
  });
});
