import { handleOpenAiAgentsSdkDemoVoiceClientSecretRequest } from "@/features/openai-agents-sdk-demo/server/voice-realtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "openai-agents-sdk-demo",
  handler: ({ request }) =>
    handleOpenAiAgentsSdkDemoVoiceClientSecretRequest(request),
});
