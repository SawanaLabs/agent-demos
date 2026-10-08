import { z } from "zod";

export const gatewayModels = ["gpt-image-2", "gemini-3.1-flash-image"] as const;
export const authModes = ["byok", "stored-byok", "unified-billing"] as const;
export const imageMediaTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
// Leave room for multipart fields under Vercel's 4.5 MB request limit.
export const maximumReferenceBytes = 3 * 1024 * 1024;
export const maximumReferences = 4;
export const gatewayRequestSchema = z.object({
  model: z.enum(gatewayModels),
  prompt: z.string().trim().min(1).max(5000),
  quality: z.enum(["low", "medium", "high"]).default("low"),
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).default("1024x1024"),
  imageSize: z.enum(["1K", "2K", "4K"]).default("1K"),
  aspectRatio: z.enum(["1:1", "2:3", "3:2", "9:16", "16:9"]).default("1:1"),
});
export type GatewayRequest = z.input<typeof gatewayRequestSchema> & {
  references?: { bytes: Uint8Array; mediaType: string }[];
};
export interface GatewaySetup {
  authMode: (typeof authModes)[number];
  missing: string[];
  models: {
    id: (typeof gatewayModels)[number];
    available: boolean;
    missing: string[];
  }[];
}
export interface CostLookup {
  customCost: boolean | null;
  estimateUsd: number | null;
  httpStatus: number | null;
  log: {
    id: string;
    model: string;
    provider: string;
    cached?: boolean;
    duration?: number;
    tokens_in?: number;
    tokens_out?: number;
    success?: boolean;
  } | null;
  source: "cloudflare-log";
  status:
    | "not-configured"
    | "missing-log-id"
    | "available"
    | "pending"
    | "failed";
}
export interface GatewayReceipt {
  actualCostUsd: null;
  cacheStatus: string | null;
  costLookup: CostLookup;
  credentialMode: (typeof authModes)[number];
  eventId: string | null;
  httpStatus: number | null;
  logId: string | null;
  provider: "openai" | "google-ai-studio";
  providerRequestId: string | null;
  providerResponseId: string | null;
  requestedModel: (typeof gatewayModels)[number];
  servedModel: string | null;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
}
export interface GatewayResult {
  images: { base64: string; mediaType: string }[];
  receipt: GatewayReceipt;
}
