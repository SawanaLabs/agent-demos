import { generateText, Output, streamText } from "ai";
import { z } from "zod";

import {
  buildTraceEvalJudgeContext,
  completeTraceEvalJudgeResult,
  formatTraceEvalJudgePrompt,
  type TraceEvalJudgeResult,
  traceEvalJudgeStreamSchema,
} from "@/lib/trace-eval-agent/model/trace-eval-judge";
import type { TraceEvalSnapshot } from "@/lib/trace-eval-agent/model/trace-eval-snapshot";
import {
  createTraceEvalAgentGateway,
  getTraceEvalAgentConfig,
  getTraceEvalAgentEnv,
  getTraceEvalAgentSetupState,
  type TraceEvalAgentEnv,
} from "./env";

interface TraceEvalAgentEvaluationRequestBody {
  snapshot?: unknown;
}

const invalidSnapshotError = 'Expected a JSON body with a "snapshot" object.';
const incompleteRunError =
  "Trace eval judge requires a completed conversation with a user prompt and assistant answer.";

const traceEvalCheckSchema = z.object({
  detail: z.string(),
  id: z.string().min(1),
  status: z.enum(["passed", "failed", "running", "skipped"]),
  title: z.string().min(1),
});

const traceEvalSourceSchema = z.object({
  id: z.string().min(1),
  origin: z.enum(["markdown-link", "source-part"]),
  title: z.string().min(1),
  url: z.string().url(),
});

const traceEvalTraceItemSchema = z.object({
  detail: z.string(),
  id: z.string().min(1),
  kind: z.enum(["user", "model", "tool", "source", "usage"]),
  metric: z.string().optional(),
  status: z.enum(["pending", "running", "passed", "failed"]),
  title: z.string().min(1),
});

const traceEvalSummarySchema = z.object({
  failed: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

const traceEvalSnapshotSchema = z.object({
  checks: z.array(traceEvalCheckSchema),
  durationMs: z.number().nonnegative().optional(),
  latestAnswer: z.string(),
  latestPrompt: z.string().nullable(),
  runId: z.string().min(1).optional(),
  score: z.number().min(0).max(1),
  sources: z.array(traceEvalSourceSchema),
  status: z.enum(["empty", "running", "complete"]),
  summary: traceEvalSummarySchema,
  totalTokens: z.number().nonnegative().optional(),
  trace: z.array(traceEvalTraceItemSchema),
});

const judgeInstructions = [
  "You are the Trace and Eval Agent LLM-as-judge evaluator.",
  "Evaluate both the final answer quality and the full run process.",
  "Deterministic checks are hard constraints. Do not hide missing search, missing sources, provider errors, or research-shape failures behind a broad qualitative score.",
  "Use normalized 0-1 scores for overallScore and every dimension score. Never return percentages or 1-5 ratings.",
  "Treat token usage as observability context only. Do not score down only because token usage is high.",
  "Use the provided rubric dimensions exactly.",
  "Return concise rationale that a production team can act on.",
].join(" ");

function readTraceEvalSnapshot(body: unknown): TraceEvalSnapshot {
  const { snapshot } = (body ?? {}) as TraceEvalAgentEvaluationRequestBody;
  const parsedSnapshot = traceEvalSnapshotSchema.safeParse(snapshot);

  if (!parsedSnapshot.success) {
    throw new Error(invalidSnapshotError);
  }

  return parsedSnapshot.data satisfies TraceEvalSnapshot;
}

async function readTraceEvalSnapshotRequest(
  request: Request
): Promise<TraceEvalSnapshot> {
  const bodyText = await request.text();

  if (!bodyText.trim()) {
    throw new Error(invalidSnapshotError);
  }

  try {
    return readTraceEvalSnapshot(JSON.parse(bodyText));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(invalidSnapshotError);
    }

    throw error;
  }
}

function assertJudgeableRun({
  answer,
  prompt,
}: {
  answer: string;
  prompt: string;
}) {
  if (!(prompt.trim() && answer.trim())) {
    throw new Error(incompleteRunError);
  }
}

export async function evaluateTraceEvalRun(
  snapshot: TraceEvalSnapshot,
  env: TraceEvalAgentEnv = getTraceEvalAgentEnv()
): Promise<{
  judge: TraceEvalJudgeResult;
}> {
  const gateway = createTraceEvalAgentGateway(env);
  const { chatModel } = getTraceEvalAgentConfig(env);
  const context = buildTraceEvalJudgeContext(snapshot);

  assertJudgeableRun(context);

  const result = await generateText({
    experimental_telemetry: {
      functionId: "trace-eval-agent.judge",
      isEnabled: true,
      metadata: {
        demo: "trace-eval-agent",
        deterministicFailures: context.deterministicFailures.length,
        judge: "llm-as-judge",
      },
      recordInputs: true,
      recordOutputs: true,
    },
    model: gateway(chatModel),
    output: Output.object({
      description:
        "A structured LLM-as-judge result for a trace/eval research-agent run.",
      name: "TraceEvalJudgeResult",
      schema: traceEvalJudgeStreamSchema,
    }),
    prompt: formatTraceEvalJudgePrompt(context),
    system: judgeInstructions,
  });

  return {
    judge: completeTraceEvalJudgeResult({
      deterministicFailures: context.deterministicFailures,
      evaluatedAt: new Date().toISOString(),
      judge: result.output,
      model: chatModel,
    }),
  };
}

function createTraceEvalJudgeStreamResponse({
  snapshot,
  env,
}: {
  snapshot: TraceEvalSnapshot;
  env: TraceEvalAgentEnv;
}) {
  const gateway = createTraceEvalAgentGateway(env);
  const { chatModel } = getTraceEvalAgentConfig(env);
  const context = buildTraceEvalJudgeContext(snapshot);

  assertJudgeableRun(context);

  const result = streamText({
    experimental_telemetry: {
      functionId: "trace-eval-agent.judge",
      isEnabled: true,
      metadata: {
        demo: "trace-eval-agent",
        deterministicFailures: context.deterministicFailures.length,
        judge: "llm-as-judge",
        transport: "object-stream",
      },
      recordInputs: true,
      recordOutputs: true,
    },
    model: gateway(chatModel),
    output: Output.object({
      description:
        "A structured LLM-as-judge result for a trace/eval research-agent run.",
      name: "TraceEvalJudgeResult",
      schema: traceEvalJudgeStreamSchema,
    }),
    prompt: formatTraceEvalJudgePrompt(context),
    system: judgeInstructions,
  });

  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk));
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    }),
    {
      headers: {
        "cache-control": "no-cache",
        "content-type": "text/plain; charset=utf-8",
      },
    }
  );
}

export async function handleTraceEvalAgentEvaluationRequest(
  request: Request,
  env: TraceEvalAgentEnv = getTraceEvalAgentEnv()
) {
  const setup = getTraceEvalAgentSetupState(env);

  if (!setup.isReady) {
    return Response.json(
      {
        error: setup.issues.join(" "),
      },
      { status: 500 }
    );
  }

  try {
    const snapshot = await readTraceEvalSnapshotRequest(request);
    const result = await evaluateTraceEvalRun(snapshot, env);

    return Response.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      [invalidSnapshotError, incompleteRunError].includes(error.message)
    ) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    throw error;
  }
}

export async function handleTraceEvalAgentEvaluationStreamRequest(
  request: Request,
  env: TraceEvalAgentEnv = getTraceEvalAgentEnv()
) {
  const setup = getTraceEvalAgentSetupState(env);

  if (!setup.isReady) {
    return Response.json(
      {
        error: setup.issues.join(" "),
      },
      { status: 500 }
    );
  }

  try {
    const snapshot = await readTraceEvalSnapshotRequest(request);
    return createTraceEvalJudgeStreamResponse({ env, snapshot });
  } catch (error) {
    if (
      error instanceof Error &&
      [invalidSnapshotError, incompleteRunError].includes(error.message)
    ) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    throw error;
  }
}
