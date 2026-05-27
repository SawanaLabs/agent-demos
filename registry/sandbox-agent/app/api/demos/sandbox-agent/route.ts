import { handleSandboxAgentRequest } from "@/lib/sandbox-agent/server/request";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleSandboxAgentRequest(request);
}
