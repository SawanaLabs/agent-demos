import { describe, expect, it } from "vitest";
import {
  getObjectGenerationRuntimeState,
  handleObjectGenerationRequest,
} from "./runtime";

const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY/i;

describe("content review runtime", () => {
  it("maps shared gateway setup into a structured-review runtime state", () => {
    expect(
      getObjectGenerationRuntimeState({
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
    const response = await handleObjectGenerationRequest(
      new Request("http://localhost/api/demos/object-generation", {
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
        createObjectGenerationStream: async (input) => ({
          textStream: (async function* () {
            yield JSON.stringify({
              attachmentCount: input.attachments.length,
              prompt: input.prompt,
            });
          })(),
        }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      attachmentCount: 1,
      prompt: "Review this draft landing page copy for policy violations.",
    });
  });

  it("streams the final object without a cross-request record lookup", async () => {
    const finalObject = {
      categories: [
        {
          label: "Unsupported claims",
          rationale: "The screenshot promises guaranteed outcomes.",
          severity: "high" as const,
        },
      ],
      decision: "needs_review" as const,
      evidence: [
        {
          filename: "landing-page.png",
          quote: "Guaranteed revenue in seven days",
          rationale: "This is an unsubstantiated performance claim.",
          sourceType: "image" as const,
        },
      ],
      findings: [
        {
          details: "The hero copy guarantees a result without support.",
          policyLabel: "Unsupported claims",
          severity: "high" as const,
          title: "Guarantee claim",
        },
      ],
      openQuestions: ["Can the submitter provide evidence for the claim?"],
      recommendedAction:
        "Remove the guarantee or add substantiation before publishing.",
      riskScore: 82,
      summary:
        "The submission needs review because it makes unsupported guarantees.",
    };

    const response = await handleObjectGenerationRequest(
      new Request("http://localhost/api/demos/object-generation", {
        body: JSON.stringify({
          attachments: [
            {
              filename: "landing-page.png",
              mediaType: "image/png",
              url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
            },
          ],
          prompt: "Review this landing page screenshot.",
        }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        createObjectGenerationStream: async () => ({
          textStream: (async function* () {
            const payload = JSON.stringify(finalObject);
            yield payload.slice(0, 80);
            yield payload.slice(80);
          })(),
        }),
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-object-generation-record-id")).toBeNull();
    await expect(response.text()).resolves.toEqual(JSON.stringify(finalObject));
  });

  it("returns a setup error before attempting structured review work", async () => {
    const response = await handleObjectGenerationRequest(
      new Request("http://localhost/api/demos/object-generation", {
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
    const response = await handleObjectGenerationRequest(
      new Request("http://localhost/api/demos/object-generation", {
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
        createObjectGenerationStream: async () => ({
          textStream: (async function* () {
            yield JSON.stringify({ ok: true });
          })(),
        }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Only image attachments and PDF attachments are supported.",
    });
  });

  it("requires either review text or at least one attachment", async () => {
    const response = await handleObjectGenerationRequest(
      new Request("http://localhost/api/demos/object-generation", {
        body: JSON.stringify({
          attachments: [],
          prompt: "   ",
        }),
        method: "POST",
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        createObjectGenerationStream: async () => ({
          textStream: (async function* () {
            yield JSON.stringify({ ok: true });
          })(),
        }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Provide text guidance, at least one attachment, or both.",
    });
  });
});
