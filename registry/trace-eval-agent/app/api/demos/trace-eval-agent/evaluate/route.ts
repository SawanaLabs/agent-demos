import { handleTraceEvalAgentEvaluationRequest } from "@/lib/trace-eval-agent/server/evaluation";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleTraceEvalAgentEvaluationRequest(request);
}
