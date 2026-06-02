import { handleObjectGenerationRequest } from "@/features/object-generation/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const maxDuration = 30;

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "object-generation",
  handler: ({ request }) => handleObjectGenerationRequest(request),
});
