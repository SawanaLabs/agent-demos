import { handleObjectGenerationRequest } from "@/features/object-generation/server/runtime";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const maxDuration = 30;

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "object-generation",
  },
  async (request) => handleObjectGenerationRequest(request)
);
