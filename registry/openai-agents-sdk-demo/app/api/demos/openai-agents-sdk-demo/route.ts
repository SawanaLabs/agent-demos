import { handleOpenAiAgentsSdkDemoRequest } from "@/lib/openai-agents-sdk-demo/server/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleOpenAiAgentsSdkDemoRequest(request);
}
