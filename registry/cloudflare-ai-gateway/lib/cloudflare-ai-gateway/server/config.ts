import type { authModes, GatewayRequest, GatewayResult } from "../contract";

export interface CloudflareConfig {
  accountId: string;
  apiToken?: string;
  authMode: (typeof authModes)[number];
  byokAlias?: string;
  gateway: "cloudflare";
  gatewayId: string;
  gatewayToken: string;
  googleKey?: string;
  openaiKey?: string;
}

export type ImageGeneratorConfig =
  | CloudflareConfig
  | { gateway: "vercel"; apiKey: string };

// One image request, no persistence or credit effects. Provider failures throw
// GatewayGenerationError with a receipt. No application retry or gateway fallback.
export type ImageGenerator = (
  request: GatewayRequest
) => Promise<GatewayResult>;
