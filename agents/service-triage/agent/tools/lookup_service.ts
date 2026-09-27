// biome-ignore lint/style/useFilenamingConvention: eve requires snake_case tool filenames — the runtime tool name comes from the filename, so the model sees this as `lookup_service`.
import { defineTool } from "eve/tools";
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

export default defineTool({
  description:
    "Directory lookup: resolve a service name to its owning team, tier, and home region.",
  inputSchema: z.object({
    service: z
      .string()
      .min(1)
      .describe('The service name to look up, for example "billing".'),
  }),
  execute({ service }) {
    const needle = service.trim().toLowerCase();
    const record = serviceDirectory.find((row) => row.name === needle);

    if (!record) {
      return {
        error: `Service "${service}" is not in the fixture directory.`,
      };
    }

    return { ...record };
  },
});
