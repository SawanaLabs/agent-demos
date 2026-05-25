import { handleTraceEvalAgentRequest } from "@/features/trace-eval-agent/server/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleTraceEvalAgentRequest(request);
}
