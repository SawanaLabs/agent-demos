import { handleOpenAiAgentsSdkDemoVoiceClientSecretRequest } from "@/features/openai-agents-sdk-demo/server/voice-realtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleOpenAiAgentsSdkDemoVoiceClientSecretRequest(request);
}
