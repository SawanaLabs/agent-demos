import { describe, expect, it, vi } from "vitest";
import type { GatewayRequest } from "../contract";
import type { CloudflareConfig, ImageGeneratorConfig } from "./config";
import { createImageGenerator } from "./generate";

function run(
  input: GatewayRequest,
  config: ImageGeneratorConfig,
  transport: typeof fetch
) {
  return createImageGenerator(config, { fetch: transport })(input);
}

const config: CloudflareConfig = {
  gateway: "cloudflare",
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

describe("Gateway credentials, failures and estimated costs", () => {
  it.each([
    "stored-byok",
    "unified-billing",
  ] as const)("removes SDK placeholder provider credentials in %s mode", async (authMode) => {
    const transport = vi.fn(async () =>
      Response.json({ data: [{ b64_json: png }] })
    );
    await run(
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
      run({ model: "gpt-image-2", prompt: "Mug" }, config, transport)
    ).rejects.toMatchObject({
      receipt: {
        gatewayRequestId: "log-1",
        httpStatus: 403,
        actualCostUsd: null,
      },
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
      run({ model: "gemini-3.1-flash-image", prompt: "Mug" }, config, transport)
    ).rejects.toMatchObject({
      message: "The model returned no image.",
      receipt: {
        gatewayRequestId: "log-1",
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
    const result = await run(
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

const vercelConfig: ImageGeneratorConfig = {
  gateway: "vercel",
  apiKey: "vercel-secret",
};
const cases = [config, vercelConfig].flatMap((settings) =>
  (["gpt-image-2", "gemini-3.1-flash-image"] as const).flatMap((model) =>
    [false, true].map((references) => ({
      settings,
      gateway: settings.gateway,
      model,
      references,
    }))
  )
);

function modelResponse(
  gateway: ImageGeneratorConfig["gateway"],
  model: GatewayRequest["model"]
) {
  if (gateway === "vercel") {
    const providerMetadata = { gateway: { generationId: "gen-1" } };
    return model === "gpt-image-2"
      ? {
          images: [png],
          providerMetadata,
          usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        }
      : {
          content: [{ type: "file", mediaType: "image/png", data: png }],
          finishReason: { unified: "stop", raw: "STOP" },
          usage: { inputTokens: { total: 10 }, outputTokens: { total: 20 } },
          providerMetadata,
        };
  }
  return model === "gpt-image-2"
    ? {
        data: [{ b64_json: png }],
        usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
      }
    : {
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
      };
}

function generationInfo() {
  return {
    data: {
      id: "gen-1",
      total_cost: 0.01,
      upstream_inference_cost: 0,
      usage: 0.01,
      created_at: "2026-10-09T00:00:00Z",
      model: "openai/gpt-image-2",
      is_byok: false,
      provider_name: "openai",
      streamed: false,
      finish_reason: "stop",
      latency: 100,
      generation_time: 200,
      native_tokens_prompt: 10,
      native_tokens_completion: 20,
      native_tokens_reasoning: 0,
      native_tokens_cached: 0,
      native_tokens_cache_creation: 0,
      billable_web_search_calls: 0,
    },
  };
}

describe("ImageGenerator Seam (real SDKs, synthetic HTTP responses)", () => {
  it.each(
    cases
  )("$gateway / $model / references=$references shares the caller contract", async ({
    settings,
    model,
    references,
  }) => {
    const transport = vi.fn(async (url: string | URL | Request) =>
      String(url).includes("/v1/generation?")
        ? Response.json(
            {
              error: { message: "not ingested", type: "invalid_request_error" },
            },
            { status: 404 }
          )
        : Response.json(modelResponse(settings.gateway, model), { headers })
    );
    const generate = createImageGenerator(settings, { fetch: transport });
    const result = await generate({
      model,
      prompt: "Make the mug blue",
      quality: "high",
      size: "1024x1536",
      imageSize: "2K",
      aspectRatio: "2:3",
      ...(references
        ? {
            references: [
              { bytes: Buffer.from(png, "base64"), mediaType: "image/png" },
            ],
          }
        : {}),
    });
    expect(result.images).toEqual([{ base64: png, mediaType: "image/png" }]);
    expect(result.receipt).toMatchObject({
      gateway: settings.gateway,
      requestedModel: model,
      actualCostUsd: null,
      gatewayRequestId: settings.gateway === "cloudflare" ? "log-1" : "gen-1",
      httpStatus: 200,
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    });
    const [url, init] = transport.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    if (settings.gateway === "vercel") {
      expect(url).toBe(
        `https://ai-gateway.vercel.sh/v3/ai/${model === "gpt-image-2" ? "image-model" : "language-model"}`
      );
      expect(
        new Headers(init.headers).get(
          model === "gpt-image-2" ? "ai-model-id" : "ai-language-model-id"
        )
      ).toBe(`${model === "gpt-image-2" ? "openai" : "google"}/${model}`);
      expect(new Headers(init.headers).get("authorization")).toBe(
        "Bearer vercel-secret"
      );
      const body = JSON.parse(init.body as string);
      expect(body.providerOptions.gateway.only).toEqual([
        model === "gpt-image-2" ? "openai" : "google",
      ]);
      if (model === "gpt-image-2") {
        expect(body).toMatchObject({
          prompt: "Make the mug blue",
          size: "1024x1536",
          n: 1,
          providerOptions: {
            openai: { quality: "high", outputFormat: "jpeg" },
          },
        });
        if (references) {
          expect(body.files[0].data).toBe(png);
        }
      } else {
        expect(body.providerOptions.google).toMatchObject({
          responseModalities: ["IMAGE"],
          imageConfig: { imageSize: "2K", aspectRatio: "2:3" },
        });
        if (references) {
          expect(body.prompt[0].content[1]).toMatchObject({
            type: "file",
            data: `data:image/png;base64,${png}`,
            mediaType: "image/png",
          });
        }
      }
      expect(result.receipt.costLookup.status).toBe("pending");
    } else if (model === "gpt-image-2") {
      expect(url).toBe(
        `https://gateway.ai.cloudflare.com/v1/account/images/openai/images/${references ? "edits" : "generations"}`
      );
      expect(new Headers(init.headers).get("authorization")).toBe(
        "Bearer openai-secret"
      );
      if (references) {
        const body = init.body as FormData;
        expect(body.get("quality")).toBe("high");
        expect(body.get("size")).toBe("1024x1536");
        expect(
          Buffer.from(await (body.get("image") as File).arrayBuffer()).toString(
            "base64"
          )
        ).toBe(png);
      }
    } else {
      expect(url).toBe(
        "https://gateway.ai.cloudflare.com/v1/account/images/google-ai-studio/v1beta/models/gemini-3.1-flash-image:generateContent"
      );
      const body = JSON.parse(init.body as string);
      expect(body.generationConfig).toMatchObject({
        responseModalities: ["IMAGE"],
        imageConfig: { imageSize: "2K", aspectRatio: "2:3" },
      });
      if (references) {
        expect(body.contents[0].parts[1].inlineData).toEqual({
          data: png,
          mimeType: "image/png",
        });
      }
      expect(result.receipt.servedModel).toBe("gemini-3.1-flash-image");
    }
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("reports Vercel cost separately from Cloudflare estimates and final billing", async () => {
    const transport = vi.fn(async (url: string | URL | Request) =>
      Response.json(
        String(url).includes("/v1/generation?")
          ? generationInfo()
          : modelResponse("vercel", "gpt-image-2")
      )
    );
    const result = await run(
      { model: "gpt-image-2", prompt: "Mug" },
      vercelConfig,
      transport
    );
    expect(result.receipt.costLookup).toMatchObject({
      source: "vercel-generation",
      status: "available",
      reportedUsd: 0.01,
      estimateUsd: null,
      isByok: false,
    });
    expect(result.receipt.actualCostUsd).toBeNull();
    expect(result.receipt.credentialMode).toBe("gateway-managed");
  });

  it("keeps Vercel error IDs without retrying or switching gateways", async () => {
    const transport = vi.fn(async (url: string | URL | Request) =>
      String(url).includes("/v1/generation?")
        ? Response.json(generationInfo())
        : Response.json(
            {
              error: { message: "denied", type: "invalid_request_error" },
              generationId: "gen-1",
            },
            { status: 403 }
          )
    );
    await expect(
      run({ model: "gpt-image-2", prompt: "Mug" }, vercelConfig, transport)
    ).rejects.toMatchObject({
      receipt: {
        gateway: "vercel",
        gatewayRequestId: "gen-1",
        httpStatus: 403,
      },
    });
    expect(
      transport.mock.calls.filter(([url]) => String(url).includes("/v3/ai/"))
    ).toHaveLength(1);
  });
});
