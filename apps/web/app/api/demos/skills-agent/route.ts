import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";
import { handleSkillsAgentRequest } from "@/features/skills-agent/server/request";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "skills-agent",
  handler: ({ request }) => handleSkillsAgentRequest(request),
});
