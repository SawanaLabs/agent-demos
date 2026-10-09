import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createGateway, generateImage, generateText, wrapImageModel } from "ai";
import { z } from "zod";
import {
  type CostLookup,
  type GatewayReceipt,
  type GatewayResult,
  gatewayRequestSchema,
} from "../contract";
import type {
  CloudflareConfig,
  ImageGenerator,
  ImageGeneratorConfig,
} from "./config";
import { captureResponse, emptyCostLookup, lookupGatewayCost } from "./receipt";

export type { ImageGenerator, ImageGeneratorConfig } from "./config";

export class GatewayGenerationError extends Error {
  readonly receipt: GatewayReceipt;
  constructor(message: string, receipt: GatewayReceipt, cause?: unknown) {
    super(message, { cause });
    this.name = "GatewayGenerationError";
    this.receipt = receipt;
  }
}

function recordUsage(
  receipt: GatewayReceipt,
  usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number }
) {
  receipt.usage = {
    inputTokens: usage.inputTokens ?? null,
    outputTokens: usage.outputTokens ?? null,
    totalTokens: usage.totalTokens ?? null,
  };
}

function cloudflareAdapter(
  config: CloudflareConfig,
  receipt: GatewayReceipt,
  transport: typeof fetch
) {
  const providerKey =
    receipt.provider === "openai" ? config.openaiKey : config.googleKey;
  if (config.authMode === "byok" && !providerKey) {
    throw new Error(`Missing ${receipt.provider} BYOK key.`);
  }
  const headers = {
    "cf-aig-authorization": `Bearer ${config.gatewayToken}`,
    "cf-aig-skip-cache": "true",
    "cf-aig-max-attempts": "1",
    "cf-aig-collect-log": "true",
    "cf-aig-collect-log-payload": "false",
    ...(config.authMode === "unified-billing"
      ? {}
      : { "cf-aig-no-wholesale": "true" }),
    ...(config.authMode === "stored-byok" && config.byokAlias
      ? { "cf-aig-byok-alias": config.byokAlias }
      : {}),
  };
  // Official providers require an apiKey. Strip their placeholder before
  // Cloudflare resolves stored keys or billing.
  const gatewayFetch: typeof fetch = async (url, init) => {
    const requestHeaders = new Headers(init?.headers);
    if (config.authMode !== "byok") {
      requestHeaders.delete("authorization");
      requestHeaders.delete("x-goog-api-key");
    }
    const response = await transport(url, { ...init, headers: requestHeaders });
    captureResponse(receipt, response);
    return response;
  };
  const baseURL = `https://gateway.ai.cloudflare.com/v1/${encodeURIComponent(config.accountId)}/${encodeURIComponent(config.gatewayId)}`;
  const openai = createOpenAI({
    baseURL: `${baseURL}/openai`,
    apiKey: providerKey ?? "unused",
    headers,
    fetch: gatewayFetch,
  });
  const google = createGoogleGenerativeAI({
    baseURL: `${baseURL}/google-ai-studio/v1beta`,
    apiKey: providerKey ?? "unused",
    headers,
    fetch: gatewayFetch,
  });
  return {
    imageModel: openai.image("gpt-image-2"),
    languageModel: google("gemini-3.1-flash-image"),
    providerOptions: {},
    captureResult(_metadata: unknown, body?: unknown) {
      if (receipt.requestedModel !== "gemini-3.1-flash-image") {
        return;
      }
      // SDK-synthesized model/id values cannot establish upstream identity.
      const metadata = z
        .object({
          modelVersion: z.string().optional(),
          responseId: z.string().optional(),
        })
        .parse(body);
      receipt.servedModel = metadata.modelVersion ?? null;
      receipt.providerResponseId = metadata.responseId ?? null;
    },
    captureError(_cause: unknown) {
      // Cloudflare error correlation is captured from HTTP headers above.
    },
    lookupCost: () =>
      lookupGatewayCost(config, receipt.gatewayRequestId, transport),
  };
}

function vercelAdapter(
  config: Extract<ImageGeneratorConfig, { gateway: "vercel" }>,
  receipt: GatewayReceipt,
  transport: typeof fetch
) {
  let lookupStatus: number | null = null;
  const gateway = createGateway({
    apiKey: config.apiKey,
    fetch: async (url, init) => {
      const isLookup = new URL(String(url)).pathname === "/v1/generation";
      const response = await transport(url, {
        ...init,
        ...(isLookup ? { signal: AbortSignal.timeout(5000) } : {}),
      });
      if (isLookup) {
        lookupStatus = response.status;
      } else {
        receipt.httpStatus = response.status;
      }
      return response;
    },
  });
  function captureResult(metadata: unknown) {
    const parsed = z
      .object({
        gateway: z.object({ generationId: z.string().optional() }).optional(),
      })
      .safeParse(metadata);
    receipt.gatewayRequestId = parsed.success
      ? (parsed.data.gateway?.generationId ?? null)
      : null;
  }
  return {
    imageModel: wrapImageModel({
      model: gateway.image("openai/gpt-image-2"),
      middleware: {
        specificationVersion: "v3",
        async wrapGenerate({ doGenerate }) {
          const result = await doGenerate();
          // generateImage discards provider metadata when it rejects an empty result.
          captureResult(result.providerMetadata);
          return result;
        },
      },
    }),
    languageModel: gateway("google/gemini-3.1-flash-image"),
    providerOptions: {
      gateway: { only: [receipt.provider] },
    },
    captureResult,
    captureError(cause: unknown) {
      // AI SDK may wrap a gateway error. Keep the gateway's generation ID.
      const visited = new Set<unknown>();
      let current = cause;
      while (current && typeof current === "object" && !visited.has(current)) {
        visited.add(current);
        if (
          "generationId" in current &&
          typeof current.generationId === "string"
        ) {
          receipt.gatewayRequestId = current.generationId;
          return;
        }
        current = "cause" in current ? current.cause : null;
      }
    },
    async lookupCost(): Promise<CostLookup> {
      const empty = (status: CostLookup["status"]) =>
        emptyCostLookup(status, "vercel-generation");
      if (!receipt.gatewayRequestId) {
        return empty("missing-request-id");
      }
      try {
        const info = await gateway.getGenerationInfo({
          id: receipt.gatewayRequestId,
        });
        return {
          ...empty("available"),
          httpStatus: lookupStatus,
          reportedUsd: z.number().finite().nonnegative().parse(info.totalCost),
          isByok: info.isByok,
          log: { id: info.id, model: info.model, provider: info.providerName },
        };
      } catch {
        return {
          ...empty(lookupStatus === 404 ? "pending" : "failed"),
          httpStatus: lookupStatus,
        };
      }
    },
  };
}

/** Select once at the composition point; callers share this Seam across gateways. */
export function createImageGenerator(
  config: ImageGeneratorConfig,
  dependencies: { fetch?: typeof fetch } = {}
): ImageGenerator {
  const transport = dependencies.fetch ?? fetch;
  return async (input) => {
    const request = gatewayRequestSchema.parse(input);
    const receipt: GatewayReceipt = {
      gateway: config.gateway,
      gatewayRequestId: null,
      provider: request.model === "gpt-image-2" ? "openai" : "google",
      requestedModel: request.model,
      credentialMode:
        config.gateway === "cloudflare" ? config.authMode : "gateway-managed",
      eventId: null,
      providerRequestId: null,
      providerResponseId: null,
      servedModel: null,
      httpStatus: null,
      cacheStatus: null,
      usage: { inputTokens: null, outputTokens: null, totalTokens: null },
      actualCostUsd: null,
      costLookup: emptyCostLookup(
        "not-configured",
        config.gateway === "cloudflare" ? "cloudflare-log" : "vercel-generation"
      ),
    };
    const adapter =
      config.gateway === "cloudflare"
        ? cloudflareAdapter(config, receipt, transport)
        : vercelAdapter(config, receipt, transport);
    const abortSignal = AbortSignal.timeout(120_000);
    let images: GatewayResult["images"];
    try {
      if (request.model === "gpt-image-2") {
        const result = await generateImage({
          model: adapter.imageModel,
          n: 1,
          maxRetries: 0,
          abortSignal,
          size: request.size,
          prompt: input.references?.length
            ? {
                text: request.prompt,
                images: input.references.map((image) => image.bytes),
              }
            : request.prompt,
          providerOptions: {
            ...adapter.providerOptions,
            openai: { quality: request.quality, outputFormat: "jpeg" },
          },
        });
        images = result.images.map((image) => ({
          base64: image.base64,
          mediaType: image.mediaType,
        }));
        adapter.captureResult(result.providerMetadata);
        recordUsage(receipt, result.usage);
      } else {
        const result = await generateText({
          model: adapter.languageModel,
          maxRetries: 0,
          abortSignal,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: request.prompt },
                ...(input.references ?? []).map((image) => ({
                  type: "image" as const,
                  image: image.bytes,
                  mediaType: image.mediaType,
                })),
              ],
            },
          ],
          providerOptions: {
            ...adapter.providerOptions,
            google: {
              responseModalities: ["IMAGE"],
              imageConfig: {
                imageSize: request.imageSize,
                aspectRatio: request.aspectRatio,
              },
            },
          },
        });
        images = result.files
          .filter((file) => file.mediaType.startsWith("image/"))
          .map((image) => ({
            base64: image.base64,
            mediaType: image.mediaType,
          }));
        adapter.captureResult(result.providerMetadata, result.response.body);
        recordUsage(receipt, result.usage);
      }
    } catch (cause) {
      adapter.captureError(cause);
      receipt.costLookup = await adapter.lookupCost();
      throw new GatewayGenerationError(
        `${config.gateway} ${receipt.provider} generation failed${receipt.httpStatus ? ` (HTTP ${receipt.httpStatus})` : " before a valid model response"}.`,
        receipt,
        cause
      );
    }
    receipt.costLookup = await adapter.lookupCost();
    if (images.length === 0) {
      throw new GatewayGenerationError("The model returned no image.", receipt);
    }
    return { images, receipt };
  };
}
