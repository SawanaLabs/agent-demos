import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateImage, generateText } from "ai";
import { z } from "zod";
import {
  type GatewayReceipt,
  type GatewayRequest,
  type GatewayResult,
  gatewayRequestSchema,
} from "../contract";
import type { CloudflareConfig } from "./env";
import { captureResponse, emptyCostLookup, lookupGatewayCost } from "./receipt";

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

export async function generateGatewayImage(
  input: GatewayRequest,
  config: CloudflareConfig,
  transport: typeof fetch = fetch
): Promise<GatewayResult> {
  const request = gatewayRequestSchema.parse(input);
  const provider =
    request.model === "gpt-image-2" ? "openai" : "google-ai-studio";
  const providerKey =
    provider === "openai" ? config.openaiKey : config.googleKey;
  if (config.authMode === "byok" && !providerKey) {
    throw new Error(`Missing ${provider} BYOK key.`);
  }
  const receipt: GatewayReceipt = {
    provider,
    requestedModel: request.model,
    credentialMode: config.authMode,
    logId: null,
    eventId: null,
    providerRequestId: null,
    providerResponseId: null,
    servedModel: null,
    httpStatus: null,
    cacheStatus: null,
    usage: { inputTokens: null, outputTokens: null, totalTokens: null },
    actualCostUsd: null,
    costLookup: emptyCostLookup("not-configured"),
  };
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
  // Official providers require an apiKey. Strip their placeholder before the
  // request leaves this server so Cloudflare can resolve stored keys or billing.
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
  const baseURL = `https://gateway.ai.cloudflare.com/v1/${encodeURIComponent(config.accountId)}/${encodeURIComponent(config.gatewayId)}/${provider}`;
  const abortSignal = AbortSignal.timeout(120_000);
  let images: GatewayResult["images"];
  try {
    if (request.model === "gpt-image-2") {
      const openai = createOpenAI({
        baseURL,
        apiKey: providerKey ?? "unused",
        headers,
        fetch: gatewayFetch,
      });
      const result = await generateImage({
        model: openai.image(request.model),
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
          openai: { quality: request.quality, outputFormat: "jpeg" },
        },
      });
      images = result.images.map((image) => ({
        base64: image.base64,
        mediaType: image.mediaType,
      }));
      recordUsage(receipt, result.usage);
    } else {
      const google = createGoogleGenerativeAI({
        baseURL: `${baseURL}/v1beta`,
        apiKey: providerKey ?? "unused",
        headers,
        fetch: gatewayFetch,
      });
      const result = await generateText({
        model: google(request.model),
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
        .map((image) => ({ base64: image.base64, mediaType: image.mediaType }));
      // AI SDK supplies its own id/modelId when the provider omits metadata.
      // Only Google's raw response identifies an upstream response and model.
      const metadata = z
        .object({
          modelVersion: z.string().optional(),
          responseId: z.string().optional(),
        })
        .parse(result.response.body);
      receipt.servedModel = metadata.modelVersion ?? null;
      receipt.providerResponseId = metadata.responseId ?? null;
      recordUsage(receipt, result.usage);
    }
  } catch (cause) {
    receipt.costLookup = await lookupGatewayCost(
      config,
      receipt.logId,
      transport
    );
    throw new GatewayGenerationError(
      `Cloudflare ${provider} generation failed${receipt.httpStatus ? ` (HTTP ${receipt.httpStatus})` : " before a valid model response"}.`,
      receipt,
      cause
    );
  }
  receipt.costLookup = await lookupGatewayCost(
    config,
    receipt.logId,
    transport
  );
  if (images.length === 0) {
    throw new GatewayGenerationError("The model returned no image.", receipt);
  }
  return { images, receipt };
}
