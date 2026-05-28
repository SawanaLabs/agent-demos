import { handleLangGraphAgentRequest } from "@/features/langgraph-agent/server/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleLangGraphAgentRequest(request);
}
