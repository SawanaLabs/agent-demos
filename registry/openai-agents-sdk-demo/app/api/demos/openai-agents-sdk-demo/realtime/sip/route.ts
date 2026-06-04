import { handleOpenAiAgentsSdkDemoSipRequest } from "@/lib/openai-agents-sdk-demo/server/voice-sip-route";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleOpenAiAgentsSdkDemoSipRequest(request);
}
