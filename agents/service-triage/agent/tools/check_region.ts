// biome-ignore lint/style/useFilenamingConvention: eve requires snake_case tool filenames — the runtime tool name comes from the filename, so the model sees this as `check_region`.
import { defineTool } from "eve/tools";
import { z } from "zod";

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

export default defineTool({
  description:
    "Fixture health feed: read the current status of a region (operational / degraded / down) with a short note.",
  inputSchema: z.object({
    region: z
      .string()
      .min(1)
      .describe('The region to check, for example "eu-west".'),
  }),
  execute({ region }) {
    const needle = region.trim().toLowerCase();
    const record = regionHealth.find((row) => row.region === needle);

    if (!record) {
      return {
        error: `Region "${region}" is not in the fixture health feed.`,
      };
    }

    return { ...record };
  },
});
