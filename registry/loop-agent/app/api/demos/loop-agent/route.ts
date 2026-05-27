import { handleLoopAgentRequest } from "@/lib/loop-agent/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleLoopAgentRequest(request);
}
