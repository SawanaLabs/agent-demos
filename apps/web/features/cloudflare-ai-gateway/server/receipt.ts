import { z } from "zod";
import type { CostLookup, GatewayReceipt } from "../contract";
import type { CloudflareConfig } from "./env";

const logSchema = z.object({
  success: z.literal(true),
  result: z.object({
    id: z.string(),
    model: z.string(),
    provider: z.string(),
    cost: z.number().finite().nonnegative().nullish(),
    custom_cost: z.boolean().nullish(),
    cached: z.boolean().optional(),
    duration: z.number().optional(),
    tokens_in: z.number().optional(),
    tokens_out: z.number().optional(),
    success: z.boolean().optional(),
  }),
});

export function emptyCostLookup(status: CostLookup["status"]): CostLookup {
  return {
    status,
    source: "cloudflare-log",
    estimateUsd: null,
    customCost: null,
    httpStatus: null,
    log: null,
  };
}

export function captureResponse(receipt: GatewayReceipt, response: Response) {
  receipt.httpStatus = response.status;
  receipt.logId = response.headers.get("cf-aig-log-id");
  receipt.eventId = response.headers.get("cf-aig-event-id");
  receipt.cacheStatus = response.headers.get("cf-aig-cache-status");
  receipt.providerRequestId = response.headers.get("x-request-id");
}

export async function lookupGatewayCost(
  config: CloudflareConfig,
  logId: string | null,
  transport: typeof fetch = fetch
): Promise<CostLookup> {
  if (!config.apiToken) {
    return emptyCostLookup("not-configured");
  }
  if (!logId) {
    return emptyCostLookup("missing-log-id");
  }
  let httpStatus: number | null = null;
  try {
    const response = await transport(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId)}/ai-gateway/gateways/${encodeURIComponent(config.gatewayId)}/logs/${encodeURIComponent(logId)}`,
      {
        headers: { Authorization: `Bearer ${config.apiToken}` },
        signal: AbortSignal.timeout(5000),
      }
    );
    httpStatus = response.status;
    if (!response.ok) {
      return {
        ...emptyCostLookup(response.status === 404 ? "pending" : "failed"),
        httpStatus,
      };
    }
    const { result } = logSchema.parse(await response.json());
    const { cost, custom_cost: customCost, ...log } = result;
    return {
      status: "available",
      source: "cloudflare-log",
      estimateUsd: cost ?? null,
      customCost: customCost ?? null,
      httpStatus,
      log,
    };
  } catch {
    // An observable cost lookup failure must not discard a completed image.
    return { ...emptyCostLookup("failed"), httpStatus };
  }
}
