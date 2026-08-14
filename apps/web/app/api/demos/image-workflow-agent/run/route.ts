import type { WorkflowGraph } from "@/features/image-workflow-agent/model/workflow-engine";
import { assertValidWorkflowGraph } from "@/features/image-workflow-agent/model/workflow-validation";
import { getImageWorkflowAgentSetupState } from "@/features/image-workflow-agent/server/env";
import { executeImageWorkflowGraph } from "@/features/image-workflow-agent/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

const invalidBodyError = 'Expected a JSON body with a "graph" object.';
const malformedJsonError = "Expected a valid JSON request body.";

interface ImageWorkflowAgentRunBody {
  graph?: WorkflowGraph;
}

function isWorkflowGraph(value: unknown): value is WorkflowGraph {
  if (!value || typeof value !== "object") {
    return false;
  }

  const graph = value as Partial<WorkflowGraph>;

  return (
    Array.isArray(graph.edges) &&
    Array.isArray(graph.nodes) &&
    typeof graph.revision === "number"
  );
}

async function readRunBody(request: Request) {
  const body = (await request.json()) as ImageWorkflowAgentRunBody;

  if (!isWorkflowGraph(body.graph)) {
    throw new Error(invalidBodyError);
  }

  try {
    assertValidWorkflowGraph(body.graph);
  } catch {
    throw new Error(invalidBodyError);
  }

  return body.graph;
}

async function handleImageWorkflowAgentRunRequest(request: Request) {
  const setupState = getImageWorkflowAgentSetupState();

  if (!setupState.isReady) {
    return Response.json(
      {
        error: setupState.issues.join(" "),
      },
      { status: 500 }
    );
  }

  try {
    const graph = await readRunBody(request);
    const nextGraph = await executeImageWorkflowGraph(graph);

    return Response.json({ graph: nextGraph });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: malformedJsonError }, { status: 400 });
    }

    if (error instanceof Error && error.message === invalidBodyError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Workflow run failed.",
      },
      { status: 500 }
    );
  }
}

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "image-workflow-agent",
  handler: ({ request }) => handleImageWorkflowAgentRunRequest(request),
});
