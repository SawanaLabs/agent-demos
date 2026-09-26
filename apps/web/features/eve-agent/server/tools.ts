import { tool } from "ai";
import { z } from "zod";

const serviceDirectory = [
  {
    name: "billing",
    owner: "payments-team",
    region: "eu-west",
    tier: "tier-0",
  },
  {
    name: "search",
    owner: "discovery-team",
    region: "us-east",
    tier: "tier-1",
  },
  {
    name: "media-pipeline",
    owner: "platform-team",
    region: "ap-south",
    tier: "tier-2",
  },
] as const;

const regionHealth = [
  {
    note: "All signals green; last incident resolved 14 days ago.",
    region: "us-east",
    status: "operational",
  },
  {
    note: "Elevated 5xx on the ingress path since 09:40 UTC; mitigation in progress.",
    region: "eu-west",
    status: "degraded",
  },
  {
    note: "All signals green.",
    region: "ap-south",
    status: "operational",
  },
] as const;

export const lookupServiceInputSchema = z.object({
  service: z
    .string()
    .trim()
    .min(1)
    .describe('The service name to look up, for example "billing".'),
});

export const lookupServiceOutputSchema = z.union([
  z.object({ error: z.string() }),
  z.object({
    name: z.string(),
    owner: z.string(),
    region: z.string(),
    tier: z.string(),
  }),
]);

export const checkRegionInputSchema = z.object({
  region: z
    .string()
    .trim()
    .min(1)
    .describe('The region identifier, for example "eu-west".'),
});

export const checkRegionOutputSchema = z.union([
  z.object({ error: z.string() }),
  z.object({
    note: z.string(),
    region: z.string(),
    status: z.string(),
  }),
]);

export type CheckRegionInput = z.infer<typeof checkRegionInputSchema>;
export type CheckRegionOutput = z.infer<typeof checkRegionOutputSchema>;
export type LookupServiceInput = z.infer<typeof lookupServiceInputSchema>;
export type LookupServiceOutput = z.infer<typeof lookupServiceOutputSchema>;

export function lookupService(service: string): LookupServiceOutput {
  const normalizedService = service.trim().toLowerCase();
  const entry = serviceDirectory.find(
    (candidate) => candidate.name === normalizedService
  );

  if (!entry) {
    const knownServices = serviceDirectory
      .map((candidate) => candidate.name)
      .join(", ");

    return {
      error: `Unknown service "${service}". Directory services: ${knownServices}.`,
    };
  }

  return {
    name: entry.name,
    owner: entry.owner,
    region: entry.region,
    tier: entry.tier,
  };
}

export function checkRegionHealth(region: string): CheckRegionOutput {
  const normalizedRegion = region.trim().toLowerCase();
  const entry = regionHealth.find(
    (candidate) => candidate.region === normalizedRegion
  );

  if (!entry) {
    return { error: `No health data for region "${region}".` };
  }

  return {
    note: entry.note,
    region: entry.region,
    status: entry.status,
  };
}

export const lookupServiceTool = tool({
  description:
    "Look up a service in the internal directory to find its owning team, tier, and home region.",
  execute: ({ service }) => lookupService(service),
  inputSchema: lookupServiceInputSchema,
  outputSchema: lookupServiceOutputSchema,
});

export const checkRegionTool = tool({
  description: "Read the current health status for a deployment region.",
  execute: ({ region }) => checkRegionHealth(region),
  inputSchema: checkRegionInputSchema,
  outputSchema: checkRegionOutputSchema,
});

export function createEveAgentTools() {
  return {
    check_region: checkRegionTool,
    lookup_service: lookupServiceTool,
  };
}
