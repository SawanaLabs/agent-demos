import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";
import { handleSkillsAgentRequest } from "@/features/skills-agent/server/request";

export const runtime = "nodejs";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "skills-agent",
  },
  async (request) => handleSkillsAgentRequest(request)
);
