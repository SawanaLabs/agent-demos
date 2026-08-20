import {
  applyWorkflowCommand,
  buildWorkflowRunPlan,
  type WorkflowGraph,
} from "../model/workflow-engine";
import {
  getImageWorkflowAgentEnv,
  type ImageWorkflowAgentEnv,
  readImageWorkflowAgentConfig,
} from "./env";
import {
  executeImageWorkflowRunPlan,
  ImageWorkflowExecutionError,
} from "./image-executor";
import {
  type ImageWorkflowTelemetryObserver,
  reportImageWorkflowFailure,
} from "./telemetry";

interface ImageWorkflowRuntimeDependencies {
  executePlan?: typeof executeImageWorkflowRunPlan;
  now?: () => number;
  observer?: ImageWorkflowTelemetryObserver;
  randomUUID?: () => string;
}

async function executePlanWithNetworkRetry(
  plan: Parameters<typeof executeImageWorkflowRunPlan>[0],
  env: ImageWorkflowAgentEnv,
  executePlan: typeof executeImageWorkflowRunPlan
) {
  try {
    return await executePlan(plan, env);
  } catch (error) {
    if (
      error instanceof ImageWorkflowExecutionError &&
      error.code === "network"
    ) {
      return executePlan(plan, env);
    }

    throw error;
  }
}

function publicRunFailureMessage(error: unknown): string {
  if (!(error instanceof ImageWorkflowExecutionError)) {
    return "Workflow run failed.";
  }

  if (error.code === "network") {
    return "Image generation network request failed.";
  }

  return "Image generation provider request failed.";
}

export async function executeImageWorkflowGraph(
  graph: WorkflowGraph,
  env: ImageWorkflowAgentEnv = getImageWorkflowAgentEnv(),
  dependencies: ImageWorkflowRuntimeDependencies = {}
): Promise<WorkflowGraph> {
  const executePlan = dependencies.executePlan ?? executeImageWorkflowRunPlan;
  const randomUUID = dependencies.randomUUID ?? (() => crypto.randomUUID());
  const config = readImageWorkflowAgentConfig(env);
  const plan = buildWorkflowRunPlan(graph, {
    imageModel: config.imageModel,
  });
  const runId = randomUUID();
  const now = dependencies.now ?? Date.now;
  const startedAt = now();
  let currentGraph = applyWorkflowCommand(graph, {
    expectedRevision: graph.revision,
    nodeId: plan.resultNodeId,
    runId,
    type: "run-start",
  });

  try {
    const image = await executePlanWithNetworkRetry(plan, env, executePlan);

    currentGraph = applyWorkflowCommand(currentGraph, {
      expectedRevision: currentGraph.revision,
      image,
      nodeId: plan.resultNodeId,
      runId,
      type: "run-success",
    });
  } catch (error) {
    const isExecutionFailure = error instanceof ImageWorkflowExecutionError;

    currentGraph = applyWorkflowCommand(currentGraph, {
      errorMessage: publicRunFailureMessage(error),
      expectedRevision: currentGraph.revision,
      nodeId: plan.resultNodeId,
      runId,
      type: "run-failure",
    });
    reportImageWorkflowFailure(dependencies.observer, {
      durationMs: Math.max(0, now() - startedAt),
      failureCategory: isExecutionFailure ? "provider" : "runtime",
      operation: "workflow_run",
      retryable: isExecutionFailure && error.code === "network",
    });
  }

  return currentGraph;
}
