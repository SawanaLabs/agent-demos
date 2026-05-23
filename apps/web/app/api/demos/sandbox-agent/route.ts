import { handleSandboxAgentRequest } from "@/features/sandbox-agent/server/runtime";

export function POST(request: Request) {
  return handleSandboxAgentRequest(request);
}
