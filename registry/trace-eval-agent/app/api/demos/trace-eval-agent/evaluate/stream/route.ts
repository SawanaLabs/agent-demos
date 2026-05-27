import { handleTraceEvalAgentEvaluationStreamRequest } from "@/lib/trace-eval-agent/server/evaluation";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleTraceEvalAgentEvaluationStreamRequest(request);
}
