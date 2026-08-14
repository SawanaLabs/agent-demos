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

interface ImageWorkflowRuntimeDependencies {
  executePlan: typeof executeImageWorkflowRunPlan;
  randomUUID: () => string;
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

export async function executeImageWorkflowGraph(
  graph: WorkflowGraph,
  env: ImageWorkflowAgentEnv = getImageWorkflowAgentEnv(),
  dependencies: ImageWorkflowRuntimeDependencies = {
    executePlan: executeImageWorkflowRunPlan,
    randomUUID: () => crypto.randomUUID(),
  }
): Promise<WorkflowGraph> {
  const config = readImageWorkflowAgentConfig(env);
  const plan = buildWorkflowRunPlan(graph, {
    imageModel: config.imageModel,
  });
  const runId = dependencies.randomUUID();
  let currentGraph = applyWorkflowCommand(graph, {
    expectedRevision: graph.revision,
    nodeId: plan.resultNodeId,
    runId,
    type: "run-start",
  });

  try {
    const image = await executePlanWithNetworkRetry(
      plan,
      env,
      dependencies.executePlan
    );

    currentGraph = applyWorkflowCommand(currentGraph, {
      expectedRevision: currentGraph.revision,
      image,
      nodeId: plan.resultNodeId,
      runId,
      type: "run-success",
    });
  } catch (error) {
    currentGraph = applyWorkflowCommand(currentGraph, {
      errorMessage:
        error instanceof Error ? error.message : "Workflow run failed.",
      expectedRevision: currentGraph.revision,
      nodeId: plan.resultNodeId,
      runId,
      type: "run-failure",
    });
  }

  return currentGraph;
}
