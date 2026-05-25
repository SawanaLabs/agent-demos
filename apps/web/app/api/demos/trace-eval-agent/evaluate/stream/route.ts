import { handleTraceEvalAgentEvaluationStreamRequest } from "@/features/trace-eval-agent/server/evaluation";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleTraceEvalAgentEvaluationStreamRequest(request);
}
