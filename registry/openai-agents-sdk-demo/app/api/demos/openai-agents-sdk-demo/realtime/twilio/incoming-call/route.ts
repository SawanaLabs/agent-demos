import { handleOpenAiAgentsSdkDemoTwilioIncomingCallRequest } from "@/lib/openai-agents-sdk-demo/server/voice-twilio-route";

export const runtime = "nodejs";

export function GET(request: Request) {
  return handleOpenAiAgentsSdkDemoTwilioIncomingCallRequest(request);
}

export function POST(request: Request) {
  return handleOpenAiAgentsSdkDemoTwilioIncomingCallRequest(request);
}
