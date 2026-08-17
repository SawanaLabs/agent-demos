import { handleMinimalChatAgentRequest } from "@/lib/minimal-chat-agent/runtime";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleMinimalChatAgentRequest(request);
}
