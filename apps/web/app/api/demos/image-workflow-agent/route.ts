import { type UIMessage, validateUIMessages } from "ai";

import type { WorkflowGraph } from "@/features/image-workflow-agent/model/workflow-engine";
import { assertValidWorkflowGraph } from "@/features/image-workflow-agent/model/workflow-validation";
import { generateImageWorkflowAgentResponse } from "@/features/image-workflow-agent/server/chat";
import { getImageWorkflowAgentSetupState } from "@/features/image-workflow-agent/server/env";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

const invalidBodyError =
  'Expected a JSON body with a "messages" array and "graph" object.';
const malformedJsonError = "Expected a valid JSON request body.";
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';

interface ImageWorkflowAgentChatRequestBody {
  graph?: WorkflowGraph;
  messages?: UIMessage[];
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

async function readChatRequestBody(
  request: Request
): Promise<{ graph: WorkflowGraph; messages: UIMessage[] }> {
  const body = (await request.json()) as ImageWorkflowAgentChatRequestBody;

  if (!(Array.isArray(body.messages) && isWorkflowGraph(body.graph))) {
    throw new Error(invalidBodyError);
  }

  try {
    assertValidWorkflowGraph(body.graph);
  } catch {
    throw new Error(invalidBodyError);
  }

  try {
    return {
      graph: body.graph,
      messages: await validateUIMessages({ messages: body.messages }),
    };
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

function toUiMessageStreamResponse(result: unknown) {
  if (result instanceof Response) {
    return result;
  }

  if (
    result &&
    typeof result === "object" &&
    "toUIMessageStreamResponse" in result &&
    typeof result.toUIMessageStreamResponse === "function"
  ) {
    return result.toUIMessageStreamResponse();
  }

  throw new Error(
    "Image workflow agent chat must return a UI message stream result."
  );
}

async function handleImageWorkflowAgentChatRequest(request: Request) {
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
    const { graph, messages } = await readChatRequestBody(request);
    const result = await generateImageWorkflowAgentResponse(messages, graph);

    return toUiMessageStreamResponse(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: malformedJsonError }, { status: 400 });
    }

    if (
      error instanceof Error &&
      [invalidBodyError, invalidUiMessagesError].includes(error.message)
    ) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "image-workflow-agent",
  handler: ({ request }) => handleImageWorkflowAgentChatRequest(request),
});
