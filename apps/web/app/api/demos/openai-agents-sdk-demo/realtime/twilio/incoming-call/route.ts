import { handleOpenAiAgentsSdkDemoTwilioIncomingCallRequest } from "@/features/openai-agents-sdk-demo/server/voice-twilio-route";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleOpenAiAgentsSdkDemoTwilioIncomingCallRequest(request);
}

export async function POST(request: Request) {
  return handleOpenAiAgentsSdkDemoTwilioIncomingCallRequest(request);
}
