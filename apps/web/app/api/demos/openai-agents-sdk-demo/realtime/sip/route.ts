import { handleOpenAiAgentsSdkDemoSipRequest } from "@/features/openai-agents-sdk-demo/server/voice-sip-route";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleOpenAiAgentsSdkDemoSipRequest(request);
}
