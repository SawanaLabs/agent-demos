import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import {
  applyWorkflowCommand,
  type WorkflowCommand,
  type WorkflowGraph,
  type WorkflowNode,
  type WorkflowResultImage,
} from "../model/workflow-engine";
import {
  createImageWorkflowAgentGateway,
  getImageWorkflowAgentEnv,
  type ImageWorkflowAgentEnv,
  type ImageWorkflowAgentGateway,
  readImageWorkflowAgentConfig,
} from "./env";
import { executeImageWorkflowGraph } from "./runtime";

const systemPrompt = [
  "You are the Image Workflow Agent.",
  "Use tools to mutate the workflow graph instead of describing graph edits abstractly.",
  "Run the workflow when the graph is ready and the user asks for image generation or editing.",
  "Keep normal prose concise and do not repeat full graph state in plain text.",
].join(" ");
const maxReferenceImageBytes = 4 * 1024 * 1024;
const maxReferenceImageDataUrlLength = 5_600_000;

const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const referenceImageSchema = z.object({
  dataUrl: z.string().max(maxReferenceImageDataUrlLength),
  filename: z.string(),
  mediaType: z.string(),
  sizeBytes: z.number().int().nonnegative().max(maxReferenceImageBytes),
});

const nodeSchema: z.ZodType<WorkflowNode> = z.discriminatedUnion("kind", [
  z.object({
    data: z.object({
      image: referenceImageSchema.nullable(),
      label: z.string(),
    }),
    id: z.string(),
    kind: z.literal("reference-image"),
    position: positionSchema,
  }),
  z.object({
    data: z.object({
      aspectRatio: z.enum(["1:1", "16:9", "9:16"]),
      prompt: z.string(),
    }),
    id: z.string(),
    kind: z.literal("image-generator"),
    position: positionSchema,
  }),
  z.object({
    data: z.object({
      activeRunId: z.string().nullable(),
      errorMessage: z.string().nullable(),
      image: z
        .object({
          dataUrl: z.string(),
          mediaType: z.string(),
        })
        .nullable(),
      prompt: z.string().nullable(),
      status: z.enum(["idle", "running", "succeeded", "failed"]),
    }),
    id: z.string(),
    kind: z.literal("image-result"),
    position: positionSchema,
  }),
]);

export const imageWorkflowGraphSchema: z.ZodType<WorkflowGraph> = z.object({
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
    })
  ),
  nodes: z.array(nodeSchema),
  revision: z.number().int().nonnegative(),
});

const updatePatchSchema = z.object({
  activeRunId: z.string().nullable().optional(),
  aspectRatio: z.enum(["1:1", "16:9", "9:16"]).optional(),
  errorMessage: z.string().nullable().optional(),
  image: z
    .object({
      dataUrl: z.string(),
      filename: z.string().optional(),
      mediaType: z.string(),
      sizeBytes: z.number().int().nonnegative().optional(),
    })
    .nullable()
    .optional(),
  label: z.string().optional(),
  prompt: z.string().nullable().optional(),
  status: z.enum(["idle", "running", "succeeded", "failed"]).optional(),
});

interface WorkflowToolOutput {
  graph: WorkflowGraph;
  image: WorkflowResultImage | null;
  kind: "workflow-command" | "workflow-run";
  summary: string;
}

export interface ImageWorkflowAgentChatDependencies {
  createGateway: (env: ImageWorkflowAgentEnv) => ImageWorkflowAgentGateway;
  executeWorkflowGraph: typeof executeImageWorkflowGraph;
  streamText: typeof streamText;
}

function summarizeWorkflowToolOutput(
  part: UIMessage["parts"][number]
): string | undefined {
  if (!("output" in part) || part.state !== "output-available") {
    return;
  }

  const output = part.output as Partial<WorkflowToolOutput>;

  if (
    (output.kind === "workflow-command" || output.kind === "workflow-run") &&
    typeof output.summary === "string"
  ) {
    return output.summary;
  }

  return;
}

function prepareImageWorkflowAgentModelMessages(messages: UIMessage[]) {
  return messages
    .map((message) => ({
      ...message,
      parts: message.parts
        .flatMap((part) => {
          if (
            part.type === "text" &&
            "text" in part &&
            typeof part.text === "string" &&
            part.text.trim()
          ) {
            return [
              {
                text: part.text,
                type: "text" as const,
              },
            ];
          }

          const summary = summarizeWorkflowToolOutput(part);

          return summary
            ? [
                {
                  text: summary,
                  type: "text" as const,
                },
              ]
            : [];
        })
        .filter((part) => part.text.trim().length > 0),
    }))
    .filter((message) => message.role === "user" || message.parts.length > 0);
}

function createWorkflowToolOutput(
  graph: WorkflowGraph,
  summary: string,
  image: WorkflowResultImage | null = null,
  kind: WorkflowToolOutput["kind"] = "workflow-command"
): WorkflowToolOutput {
  return {
    graph,
    image,
    kind,
    summary,
  };
}

function createModelWorkflowContext(graph: WorkflowGraph) {
  return JSON.stringify(graph, (key, value) =>
    key === "dataUrl" ? "[omitted]" : value
  );
}

export async function generateImageWorkflowAgentResponse(
  messages: UIMessage[],
  graph: WorkflowGraph,
  env: ImageWorkflowAgentEnv = getImageWorkflowAgentEnv(),
  dependencies: ImageWorkflowAgentChatDependencies = {
    createGateway: createImageWorkflowAgentGateway,
    executeWorkflowGraph: executeImageWorkflowGraph,
    streamText,
  }
): Promise<{ toUIMessageStreamResponse: () => Response }> {
  const config = readImageWorkflowAgentConfig(env);
  const gateway = dependencies.createGateway(env);
  let currentGraph = graph;

  async function applyCommand(command: WorkflowCommand, summary: string) {
    currentGraph = applyWorkflowCommand(currentGraph, command);

    return createWorkflowToolOutput(currentGraph, summary);
  }

  return dependencies.streamText({
    messages: await convertToModelMessages(
      prepareImageWorkflowAgentModelMessages(messages)
    ),
    model: gateway.languageModel(config.chatModel),
    stopWhen: stepCountIs(6),
    system: `${systemPrompt}\nCurrent workflow graph (image data URLs omitted): ${createModelWorkflowContext(currentGraph)}`,
    tools: {
      replaceWorkflow: tool({
        description:
          "Replace the entire workflow graph with a validated graph.",
        execute: ({ graph: nextGraph }) =>
          applyCommand(
            {
              expectedRevision: currentGraph.revision,
              graph: nextGraph,
              type: "replace-workflow",
            },
            `Replaced the workflow graph at revision ${currentGraph.revision + 1}.`
          ),
        inputSchema: z.object({
          graph: imageWorkflowGraphSchema,
        }),
        toModelOutput: ({ output }) => ({
          type: "text",
          value: output.summary,
        }),
      }),
      addNode: tool({
        description: "Add a workflow node.",
        execute: ({ node }) =>
          applyCommand(
            {
              expectedRevision: currentGraph.revision,
              node,
              type: "add-node",
            },
            `Added node ${node.id}.`
          ),
        inputSchema: z.object({
          node: nodeSchema,
        }),
        toModelOutput: ({ output }) => ({
          type: "text",
          value: output.summary,
        }),
      }),
      updateNode: tool({
        description: "Update a workflow node with a validated patch.",
        execute: ({ nodeId, patch }) =>
          applyCommand(
            {
              expectedRevision: currentGraph.revision,
              nodeId,
              patch,
              type: "update-node",
            },
            `Updated node ${nodeId}.`
          ),
        inputSchema: z.object({
          nodeId: z.string(),
          patch: updatePatchSchema,
        }),
        toModelOutput: ({ output }) => ({
          type: "text",
          value: output.summary,
        }),
      }),
      connectNodes: tool({
        description: "Connect two workflow nodes.",
        execute: ({ sourceNodeId, targetNodeId }) =>
          applyCommand(
            {
              expectedRevision: currentGraph.revision,
              sourceNodeId,
              targetNodeId,
              type: "connect-nodes",
            },
            `Connected ${sourceNodeId} to ${targetNodeId}.`
          ),
        inputSchema: z.object({
          sourceNodeId: z.string(),
          targetNodeId: z.string(),
        }),
        toModelOutput: ({ output }) => ({
          type: "text",
          value: output.summary,
        }),
      }),
      runWorkflow: tool({
        description:
          "Run the current workflow and attach the generated result image.",
        execute: async () => {
          currentGraph = await dependencies.executeWorkflowGraph(
            currentGraph,
            env
          );
          const resultNode = currentGraph.nodes.find(
            (node) => node.kind === "image-result"
          );
          const succeeded = resultNode?.data.status === "succeeded";

          return createWorkflowToolOutput(
            currentGraph,
            succeeded
              ? `Ran the workflow successfully and updated ${resultNode.id}.`
              : `Workflow run failed: ${resultNode?.data.errorMessage ?? "Unknown error."}`,
            resultNode?.data.image ?? null,
            "workflow-run"
          );
        },
        inputSchema: z.object({}).passthrough(),
        toModelOutput: ({ output }) => ({
          type: "text",
          value: output.summary,
        }),
      }),
    },
  });
}
