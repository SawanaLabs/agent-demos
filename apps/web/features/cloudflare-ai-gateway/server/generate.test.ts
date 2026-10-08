import { describe, expect, it, vi } from "vitest";
import type { CloudflareConfig } from "./env";
import { generateGatewayImage } from "./generate";

const config: CloudflareConfig = {
  accountId: "account",
  gatewayId: "images",
  gatewayToken: "gateway-secret",
  authMode: "byok",
  openaiKey: "openai-secret",
  googleKey: "google-secret",
};
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j9n0AAAAASUVORK5CYII=";
const headers = {
  "cf-aig-log-id": "log-1",
  "cf-aig-event-id": "event-1",
  "x-request-id": "provider-1",
};

describe("Cloudflare image transport contract (synthetic provider responses)", () => {
  it("uses native OpenAI Images generation and preserves the receipt without inventing cost", async () => {
    const transport = vi.fn(async () =>
      Response.json(
        {
          created: 1,
          data: [{ b64_json: png }],
          usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
        },
        { headers }
      )
    );
    const result = await generateGatewayImage(
      { model: "gpt-image-2", prompt: "A red mug" },
      config,
      transport
    );
    const [url, init] = transport.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      "https://gateway.ai.cloudflare.com/v1/account/images/openai/images/generations"
    );
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: "gpt-image-2",
      n: 1,
      quality: "low",
      output_format: "jpeg",
    });
    expect(new Headers(init.headers).get("authorization")).toBe(
      "Bearer openai-secret"
    );
    expect(new Headers(init.headers).get("cf-aig-no-wholesale")).toBe("true");
    expect(result.receipt).toMatchObject({
      logId: "log-1",
      eventId: "event-1",
      providerRequestId: "provider-1",
      actualCostUsd: null,
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    });
    expect(result.receipt.costLookup.status).toBe("not-configured");
    expect(result.images).toHaveLength(1);
  });

  it("uses multipart OpenAI image editing with reference bytes", async () => {
    const transport = vi.fn(async () =>
      Response.json({ data: [{ b64_json: png }] }, { headers })
    );
    await generateGatewayImage(
      {
        model: "gpt-image-2",
        prompt: "Make it blue",
        references: [
          { bytes: Buffer.from(png, "base64"), mediaType: "image/png" },
        ],
      },
      config,
      transport
    );
    const [url, init] = transport.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toContain("/openai/images/edits");
    const body = init.body as FormData;
    expect(body.get("model")).toBe("gpt-image-2");
    const file = body.get("image") as File;
    expect(Buffer.from(await file.arrayBuffer()).toString("base64")).toBe(png);
  });

  it("uses native Gemini generateContent with inline reference images and IMAGE output", async () => {
    const transport = vi.fn(async () =>
      Response.json(
        {
          candidates: [
            {
              content: {
                role: "model",
                parts: [{ inlineData: { mimeType: "image/png", data: png } }],
              },
              finishReason: "STOP",
            },
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 20,
            totalTokenCount: 30,
          },
          modelVersion: "gemini-3.1-flash-image",
          responseId: "gemini-response",
        },
        { headers }
      )
    );
    const result = await generateGatewayImage(
      {
        model: "gemini-3.1-flash-image",
        prompt: "Make it blue",
        references: [
          { bytes: Buffer.from(png, "base64"), mediaType: "image/png" },
        ],
      },
      config,
      transport
    );
    const [url, init] = transport.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      "https://gateway.ai.cloudflare.com/v1/account/images/google-ai-studio/v1beta/models/gemini-3.1-flash-image:generateContent"
    );
    expect(JSON.parse(init.body as string)).toMatchObject({
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { imageSize: "1K" },
      },
      contents: [
        {
          parts: [
            { text: "Make it blue" },
            { inlineData: { mimeType: "image/png", data: png } },
          ],
        },
      ],
    });
    expect(result.images[0]?.mediaType).toBe("image/png");
    expect(result.receipt.providerResponseId).toBe("gemini-response");
    expect(result.receipt.servedModel).toBe("gemini-3.1-flash-image");
  });
});

describe("Gateway credentials, failures and estimated costs", () => {
  it.each([
    "stored-byok",
    "unified-billing",
  ] as const)("removes SDK placeholder provider credentials in %s mode", async (authMode) => {
    const transport = vi.fn(async () =>
      Response.json({ data: [{ b64_json: png }] })
    );
    await generateGatewayImage(
      { model: "gpt-image-2", prompt: "Mug" },
      { ...config, authMode },
      transport
    );
    const [, init] = transport.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const requestHeaders = new Headers(init.headers);
    expect(requestHeaders.has("authorization")).toBe(false);
    expect(requestHeaders.get("cf-aig-authorization")).toBe(
      "Bearer gateway-secret"
    );
    expect(requestHeaders.get("cf-aig-no-wholesale")).toBe(
      authMode === "stored-byok" ? "true" : null
    );
  });

  it("does not retry or switch gateway on provider failure and keeps error receipt", async () => {
    const transport = vi.fn(async () =>
      Response.json(
        {
          error: {
            message: "denied",
            type: "invalid_request_error",
            code: "denied",
          },
        },
        { status: 403, headers }
      )
    );
    await expect(
      generateGatewayImage(
        { model: "gpt-image-2", prompt: "Mug" },
        config,
        transport
      )
    ).rejects.toMatchObject({
      receipt: { logId: "log-1", httpStatus: 403, actualCostUsd: null },
    });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("rejects a text-only Gemini success with its request receipt", async () => {
    const transport = vi.fn(async () =>
      Response.json(
        {
          candidates: [
            {
              content: { role: "model", parts: [{ text: "No image" }] },
              finishReason: "STOP",
            },
          ],
        },
        { headers }
      )
    );
    await expect(
      generateGatewayImage(
        { model: "gemini-3.1-flash-image", prompt: "Mug" },
        config,
        transport
      )
    ).rejects.toMatchObject({
      message: "The model returned no image.",
      receipt: {
        logId: "log-1",
        httpStatus: 200,
        providerResponseId: null,
        servedModel: null,
      },
    });
  });

  it("records log cost as an estimate and whitelists log fields", async () => {
    const transport = vi.fn(async (url: string | URL | Request) =>
      String(url).startsWith("https://api.cloudflare.com")
        ? Response.json({
            success: true,
            result: {
              id: "log-1",
              model: "gpt-image-2",
              provider: "openai",
              cost: 0.012,
              cached: false,
              tokens_in: 10,
              tokens_out: 20,
              duration: 200,
              success: true,
              request_head: "private prompt",
            },
          })
        : Response.json({ data: [{ b64_json: png }] }, { headers })
    );
    const result = await generateGatewayImage(
      { model: "gpt-image-2", prompt: "Mug" },
      { ...config, apiToken: "management-secret" },
      transport
    );
    expect(result.receipt.costLookup).toMatchObject({
      status: "available",
      estimateUsd: 0.012,
      source: "cloudflare-log",
    });
    expect(result.receipt.actualCostUsd).toBeNull();
    expect(JSON.stringify(result)).not.toContain("private prompt");
    expect(transport.mock.calls[1]?.[0]).toBe(
      "https://api.cloudflare.com/client/v4/accounts/account/ai-gateway/gateways/images/logs/log-1"
    );
  });
});
