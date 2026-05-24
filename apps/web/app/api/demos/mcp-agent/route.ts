import { handleMcpAgentRequest } from "@/features/mcp-agent/server/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleMcpAgentRequest(request);
}
