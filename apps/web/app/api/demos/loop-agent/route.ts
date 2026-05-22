import { handleLoopAgentRequest } from "@/features/loop-agent/server/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleLoopAgentRequest(request);
}
