import type { UIMessage } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { convertToModelMessagesMock } = vi.hoisted(() => ({
  convertToModelMessagesMock: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();

  return {
    ...actual,
    convertToModelMessages: convertToModelMessagesMock,
  };
});

import {
  applyWorkflowCommand,
  createDefaultWorkflowGraph,
  type WorkflowGraph,
} from "../model/workflow-engine";
import { generateImageWorkflowAgentResponse } from "./chat";

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: this integration-style suite shares one request-scoped tool lifecycle and keeps its cross-tool assertions together.
describe("image workflow agent chat", () => {
  beforeEach(() => {
    convertToModelMessagesMock.mockReset();
    convertToModelMessagesMock.mockImplementation(async (messages) => messages);
  });

  it("uses the configured chat model and exposes the workflow tools", async () => {
    const gateway = {
      languageModel: vi.fn((modelId: string) => `chat-model:${modelId}`),
    };
    const streamTextMock = vi.fn().mockResolvedValue({ text: "done" });

    await generateImageWorkflowAgentResponse(
      [
        {
          id: "m1",
          parts: [{ text: "Please edit this workflow.", type: "text" }],
          role: "user",
        },
      ],
      createDefaultWorkflowGraph(),
      {
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5-mini",
      },
      {
        createGateway: () => gateway as never,
        executeWorkflowGraph: vi.fn(),
        streamText: streamTextMock,
      }
    );

    expect(gateway.languageModel).toHaveBeenCalledWith("openai/gpt-5-mini");
    const request = streamTextMock.mock.calls[0]?.[0];
    expect(request?.system).toContain('"revision":0');
    expect(request?.system).toContain('"id":"generator-1"');
    expect(request?.system).toContain(
      "Do not send null placeholders from other node kinds"
    );
    expect(streamTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "chat-model:openai/gpt-5-mini",
        system: expect.stringContaining(
          "Use tools to mutate the workflow graph"
        ),
        tools: expect.objectContaining({
          addNode: expect.any(Object),
          connectNodes: expect.any(Object),
          replaceWorkflow: expect.any(Object),
          runWorkflow: expect.any(Object),
          updateNode: expect.any(Object),
        }),
      })
    );
  });

  it("summarizes prior tool output instead of replaying graph base64 into model history", async () => {
    const streamTextMock = vi.fn().mockResolvedValue({ text: "done" });

    await generateImageWorkflowAgentResponse(
      [
        {
          id: "assistant-1",
          parts: [
            {
              input: {},
              output: {
                graph: createDefaultWorkflowGraph(),
                image: {
                  dataUrl: "data:image/png;base64,AAAA",
                  mediaType: "image/png",
                },
                kind: "workflow-run",
                summary: "Ran the workflow successfully and updated result-1.",
              },
              state: "output-available",
              toolCallId: "call-1",
              type: "tool-runWorkflow",
            },
          ],
          role: "assistant",
        },
        {
          id: "user-1",
          parts: [{ text: "Change the prompt slightly.", type: "text" }],
          role: "user",
        },
      ] as UIMessage[],
      createDefaultWorkflowGraph(),
      {
        AI_GATEWAY_API_KEY: "test-key",
      },
      {
        createGateway: () =>
          ({
            languageModel: () => "chat-model",
          }) as never,
        executeWorkflowGraph: vi.fn(),
        streamText: streamTextMock,
      }
    );

    expect(convertToModelMessagesMock).toHaveBeenCalledWith([
      {
        id: "assistant-1",
        parts: [
          {
            text: "Ran the workflow successfully and updated result-1.",
            type: "text",
          },
        ],
        role: "assistant",
      },
      {
        id: "user-1",
        parts: [{ text: "Change the prompt slightly.", type: "text" }],
        role: "user",
      },
    ]);
  });

  it("reports a provider failure once when chat startup rejects", async () => {
    const onFailure = vi.fn();
    const now = vi.fn().mockReturnValueOnce(100).mockReturnValueOnce(350);

    await expect(
      generateImageWorkflowAgentResponse(
        [
          {
            id: "m1",
            parts: [{ text: "Generate an image.", type: "text" }],
            role: "user",
          },
        ],
        createDefaultWorkflowGraph(),
        { AI_GATEWAY_API_KEY: "test-key" },
        {
          createGateway: () => ({ languageModel: () => "chat-model" }) as never,
          executeWorkflowGraph: vi.fn(),
          now,
          observer: { onFailure },
          streamText: vi
            .fn()
            .mockRejectedValue(new Error("Private provider response.")),
        }
      )
    ).rejects.toThrowError("Image workflow chat provider failed.");

    expect(onFailure).toHaveBeenCalledOnce();
    expect(onFailure).toHaveBeenCalledWith({
      durationMs: 250,
      failureCategory: "provider",
      operation: "chat",
      retryable: false,
    });
    expect(JSON.stringify(onFailure.mock.calls)).not.toContain(
      "Private provider response."
    );
  });

  it("keeps expected runnable validation out of runtime error logging", async () => {
    const observer = { onFailure: vi.fn() };
    const streamTextMock = vi.fn().mockResolvedValue({ text: "done" });
    const baseGraph = createDefaultWorkflowGraph();
    const invalidGraph = applyWorkflowCommand(baseGraph, {
      expectedRevision: baseGraph.revision,
      nodeId: "generator-1",
      patch: { prompt: "" },
      type: "update-node",
    });

    await generateImageWorkflowAgentResponse(
      [
        {
          id: "m1",
          parts: [{ text: "Run it.", type: "text" }],
          role: "user",
        },
      ],
      invalidGraph,
      { AI_GATEWAY_API_KEY: "test-key" },
      {
        createGateway: () => ({ languageModel: () => "chat-model" }) as never,
        observer,
        streamText: streamTextMock,
      }
    );

    const toolSet = streamTextMock.mock.calls[0]?.[0]?.tools as Record<
      string,
      {
        execute: (input: never) => unknown;
      }
    >;
    const validationFailure = await Promise.resolve(
      toolSet.runWorkflow?.execute({} as never)
    ).catch((error: unknown) => error);

    expect(validationFailure).toBeInstanceOf(Error);
    expect((validationFailure as Error).message).toBe(
      "Image generator prompt is required."
    );
    streamTextMock.mock.calls[0]?.[0]?.onError?.({
      error: validationFailure,
    });
    expect(observer.onFailure).not.toHaveBeenCalled();
  });

  // biome-ignore lint/complexity/noExcessiveLinesPerFunction: one request-scoped tool lifecycle keeps cross-tool serialization and telemetry assertions together.
  it("mutates a request-scoped graph through addNode and runWorkflow", async () => {
    const executeWorkflowGraphMock = vi.fn(
      async (graph: WorkflowGraph): Promise<WorkflowGraph> => {
        const started = applyWorkflowCommand(graph, {
          expectedRevision: graph.revision,
          nodeId: "result-1",
          runId: "run-1",
          type: "run-start",
        });

        return applyWorkflowCommand(started, {
          expectedRevision: started.revision,
          image: {
            dataUrl: "data:image/png;base64,c3VjY2Vzcw==",
            mediaType: "image/png",
          },
          nodeId: "result-1",
          runId: "run-1",
          type: "run-success",
        });
      }
    );
    const streamTextMock = vi.fn().mockResolvedValue({ text: "done" });
    const observer = { onFailure: vi.fn() };

    await generateImageWorkflowAgentResponse(
      [
        {
          id: "m1",
          parts: [{ text: "Use tools.", type: "text" }],
          role: "user",
        },
      ],
      createDefaultWorkflowGraph(),
      {
        AI_GATEWAY_API_KEY: "test-key",
      },
      {
        createGateway: () =>
          ({
            languageModel: () => "chat-model",
          }) as never,
        executeWorkflowGraph: executeWorkflowGraphMock,
        observer,
        streamText: streamTextMock,
      }
    );

    const toolSet = streamTextMock.mock.calls[0]?.[0]?.tools as Record<
      string,
      {
        execute: (input: unknown) => Promise<unknown> | unknown;
        toModelOutput: (input: {
          output: unknown;
        }) => Promise<unknown> | unknown;
      }
    >;

    const addNodeTool = toolSet.addNode;
    const updateNodeTool = toolSet.updateNode;
    const connectNodesTool = toolSet.connectNodes;
    const runWorkflowTool = toolSet.runWorkflow;

    if (
      !(addNodeTool && updateNodeTool && connectNodesTool && runWorkflowTool)
    ) {
      throw new Error("Expected workflow tools were not configured.");
    }

    const added = (await addNodeTool.execute({
      node: {
        data: {
          image: {
            dataUrl: "data:image/png;base64,cmVm",
            filename: "reference.png",
            mediaType: "image/png",
            sizeBytes: 32,
          },
          label: "Reference image",
        },
        id: "reference-1",
        kind: "reference-image",
        position: {
          x: 0,
          y: 0,
        },
      },
    })) as {
      graph: ReturnType<typeof createDefaultWorkflowGraph>;
    };

    const updated = await updateNodeTool.execute({
      nodeId: "generator-1",
      patch: {
        activeRunId: null,
        errorMessage: null,
        image: null,
        prompt: "A stark editorial portrait",
      },
    });

    const toolFailure = await Promise.resolve(
      updateNodeTool.execute({
        nodeId: "generator-1",
        patch: {
          activeRunId: "forged-run",
          prompt: "This invalid lifecycle field must still be rejected",
        },
      })
    ).catch((error: unknown) => error);
    expect(toolFailure).toBeInstanceOf(Error);
    expect((toolFailure as Error).message).toBe(
      'Workflow patch is invalid for node "generator-1".'
    );
    expect(observer.onFailure).toHaveBeenCalledOnce();
    expect(observer.onFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        failureCategory: "tool",
        operation: "tool_call",
        retryable: false,
      })
    );

    const streamOnError = streamTextMock.mock.calls[0]?.[0]?.onError;
    expect(streamOnError).toBeTypeOf("function");
    streamOnError?.({ error: toolFailure });
    streamOnError?.({ error: toolFailure });
    expect(observer.onFailure).toHaveBeenCalledOnce();

    const connected = await connectNodesTool.execute({
      sourceNodeId: "reference-1",
      targetNodeId: "generator-1",
    });

    const ran = (await runWorkflowTool.execute({})) as {
      acceptedAction: {
        action: "run_workflow";
        hasReferenceImage: boolean;
        source: "agent";
      };
      graph: ReturnType<typeof createDefaultWorkflowGraph>;
      image: {
        dataUrl: string;
        mediaType: string;
      } | null;
      summary: string;
    };
    const modelOutput = await runWorkflowTool.toModelOutput({ output: ran });

    expect(modelOutput).toEqual({
      type: "text",
      value: "Ran the workflow successfully and updated result-1.",
    });
    expect(JSON.stringify(modelOutput)).not.toContain("c3VjY2Vzcw==");

    expect(added).toMatchObject({
      acceptedAction: {
        action: "modify_workflow",
        source: "agent",
      },
    });
    expect(added.graph.revision).toBe(1);
    expect(updated).toMatchObject({
      acceptedAction: {
        action: "modify_workflow",
        source: "agent",
      },
      summary: "Updated node generator-1.",
    });
    expect(connected).toMatchObject({
      acceptedAction: {
        action: "modify_workflow",
        source: "agent",
      },
      summary: "Connected reference-1 to generator-1.",
    });
    expect(ran.acceptedAction).toEqual({
      action: "run_workflow",
      hasReferenceImage: true,
      source: "agent",
    });
    expect(executeWorkflowGraphMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nodes: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              prompt: "A stark editorial portrait",
            }),
            id: "generator-1",
          }),
          expect.objectContaining({
            data: expect.objectContaining({
              image: expect.objectContaining({ filename: "reference.png" }),
            }),
            id: "reference-1",
          }),
        ]),
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      { observer }
    );
    expect(ran.image).toEqual({
      dataUrl: "data:image/png;base64,c3VjY2Vzcw==",
      mediaType: "image/png",
    });
    expect(
      ran.graph.nodes.find((node) => node.id === "result-1")
    ).toMatchObject({
      data: {
        activeRunId: null,
        image: {
          dataUrl: "data:image/png;base64,c3VjY2Vzcw==",
          mediaType: "image/png",
        },
        status: "succeeded",
      },
    });

    const concurrentRun = runWorkflowTool.execute({});
    const concurrentUpdate = updateNodeTool.execute({
      nodeId: "generator-1",
      patch: {
        prompt: "Preserve this edit after the in-flight run",
      },
    });

    await Promise.all([concurrentRun, concurrentUpdate]);
    await runWorkflowTool.execute({});

    expect(executeWorkflowGraphMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        nodes: expect.arrayContaining([
          expect.objectContaining({
            data: expect.objectContaining({
              prompt: "Preserve this edit after the in-flight run",
            }),
            id: "generator-1",
          }),
        ]),
      }),
      { AI_GATEWAY_API_KEY: "test-key" },
      { observer }
    );
  });
});
