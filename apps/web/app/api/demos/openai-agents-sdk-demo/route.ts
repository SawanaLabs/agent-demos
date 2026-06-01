import { handleOpenAiAgentsSdkDemoRequest } from "@/features/openai-agents-sdk-demo/server/runtime";
import { withSiteUsageGate } from "@/features/site-usage-gate/server/route-handler";

export const runtime = "nodejs";

export const POST = withSiteUsageGate(
  {
    action: "send_message",
    demoSlug: "openai-agents-sdk-demo",
  },
  async (request) => handleOpenAiAgentsSdkDemoRequest(request)
);
