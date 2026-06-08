import { handleProjectGuideCompanionRequest } from "@/features/project-guide-companion/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "project-guide-companion",
  handler: ({ request }) => handleProjectGuideCompanionRequest(request),
});
