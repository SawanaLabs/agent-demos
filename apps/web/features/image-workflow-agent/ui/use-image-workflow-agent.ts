"use client";

import { Chat, useChat } from "@ai-sdk/react";
import type { Canvas } from "@workspace/ui/components/ai-elements/canvas";
import { DefaultChatTransport, type UIMessage } from "ai";
import type {
  ComponentProps,
  Dispatch,
  RefObject,
  SetStateAction,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { convertFilesToParts } from "@/features/multimodal-chatbot/ui/convert-files-to-parts";
import { useConversationErrorRetry } from "@/features/shared/chat/ui/conversation-error-message";
import {
  dispatchAcceptedImageWorkflowAction,
  type ImageWorkflowProductTelemetry,
  noopImageWorkflowProductTelemetry,
} from "../model/telemetry";
import {
  applyWorkflowCommand,
  createDefaultWorkflowGraph,
  type WorkflowGraph,
  type WorkflowReferenceImage,
} from "../model/workflow-engine";
import { getRunnableWorkflowState } from "../model/workflow-validation";
import {
  applyWorkflowNodeChanges,
  commitAcceptedWorkflowGraph,
  createReferenceImageNode,
  getImageResultNode,
  getLatestWorkflowGraph,
  getReferenceImageNode,
  getUnconsumedWorkflowActions,
  hasGraphChangingNodeChange,
  imageWorkflowAgentSuggestions,
  shouldTrackWorkflowNodeChanges,
  shouldTrackWorkflowNodePatch,
} from "./image-workflow-agent-model";

const maxReferenceImageBytes = 4 * 1024 * 1024;

interface WorkflowConnection {
  source: string | null;
  target: string | null;
}

type WorkflowNodeChange = Parameters<
  NonNullable<ComponentProps<typeof Canvas>["onNodesChange"]>
>[0][number];
type GraphMutator = (
  mutator: (currentGraph: WorkflowGraph) => WorkflowGraph,
  options?: { trackModification?: boolean }
) => void;
type SetManualError = Dispatch<SetStateAction<string | null>>;

function createImageWorkflowChat(getGraph: () => WorkflowGraph) {
  return new Chat<UIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/demos/image-workflow-agent",
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            graph: getGraph(),
            messages,
          },
        };
      },
    }),
  });
}

function toReferenceImage(file: File, dataUrl: string): WorkflowReferenceImage {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be used as the reference image.");
  }

  if (file.size > maxReferenceImageBytes) {
    throw new Error("Reference image exceeds the 4 MiB limit.");
  }

  return {
    dataUrl,
    filename: file.name,
    mediaType: file.type,
    sizeBytes: file.size,
  };
}

function useGraphMutator({
  graphRef,
  isGraphLocked,
  productTelemetry,
  setGraph,
  setManualError,
}: {
  graphRef: RefObject<WorkflowGraph>;
  isGraphLocked: boolean;
  productTelemetry: ImageWorkflowProductTelemetry;
  setGraph: Dispatch<SetStateAction<WorkflowGraph>>;
  setManualError: SetManualError;
}) {
  return useCallback<GraphMutator>(
    (mutator, mutationOptions) => {
      if (isGraphLocked) {
        setManualError(
          "Workflow is locked while the agent or manual run is still active."
        );
        return;
      }

      setManualError(null);
      try {
        const currentGraph = graphRef.current;
        const nextGraph = mutator(currentGraph);

        if (nextGraph === currentGraph) {
          return;
        }

        graphRef.current = nextGraph;
        setGraph(nextGraph);

        if (mutationOptions?.trackModification !== false) {
          productTelemetry.onAcceptedAction({
            action: "modify_workflow",
            source: "manual",
          });
        }
      } catch (error) {
        setManualError(
          error instanceof Error ? error.message : "Workflow update failed."
        );
      }
    },
    [graphRef, isGraphLocked, productTelemetry, setGraph, setManualError]
  );
}

function useWorkflowEditingActions(mutateGraph: GraphMutator) {
  const addReferenceNode = useCallback(() => {
    mutateGraph((currentGraph) => {
      if (getReferenceImageNode(currentGraph)) {
        return currentGraph;
      }

      return applyWorkflowCommand(currentGraph, {
        expectedRevision: currentGraph.revision,
        node: createReferenceImageNode(),
        type: "add-node",
      });
    });
  }, [mutateGraph]);

  const resetWorkflow = useCallback(() => {
    mutateGraph((currentGraph) =>
      applyWorkflowCommand(currentGraph, {
        expectedRevision: currentGraph.revision,
        graph: createDefaultWorkflowGraph(),
        type: "replace-workflow",
      })
    );
  }, [mutateGraph]);

  const updateNode = useCallback(
    (
      nodeId: string,
      patch: Record<string, unknown>,
      options?: { trackModification?: boolean }
    ) => {
      mutateGraph(
        (currentGraph) =>
          applyWorkflowCommand(currentGraph, {
            expectedRevision: currentGraph.revision,
            nodeId,
            patch,
            type: "update-node",
          }),
        {
          trackModification:
            options?.trackModification ?? shouldTrackWorkflowNodePatch(patch),
        }
      );
    },
    [mutateGraph]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      mutateGraph((currentGraph) =>
        applyWorkflowCommand(currentGraph, {
          expectedRevision: currentGraph.revision,
          nodeId,
          type: "delete-node",
        })
      );
    },
    [mutateGraph]
  );

  const handleNodesChange = useCallback(
    (changes: WorkflowNodeChange[]) => {
      if (!hasGraphChangingNodeChange(changes)) {
        return;
      }

      mutateGraph(
        (currentGraph) => applyWorkflowNodeChanges(currentGraph, changes),
        { trackModification: shouldTrackWorkflowNodeChanges(changes) }
      );
    },
    [mutateGraph]
  );

  const handleConnect = useCallback(
    (connection: WorkflowConnection) => {
      if (!(connection.source && connection.target)) {
        return;
      }

      mutateGraph((currentGraph) =>
        applyWorkflowCommand(currentGraph, {
          expectedRevision: currentGraph.revision,
          sourceNodeId: connection.source as string,
          targetNodeId: connection.target as string,
          type: "connect-nodes",
        })
      );
    },
    [mutateGraph]
  );

  return {
    addReferenceNode,
    deleteNode,
    handleConnect,
    handleNodesChange,
    resetWorkflow,
    updateNode,
  };
}

function useReferenceImageUpload({
  setManualError,
  updateNode,
}: {
  setManualError: SetManualError;
  updateNode: (nodeId: string, patch: Record<string, unknown>) => void;
}) {
  return useCallback(
    async (nodeId: string, fileList: FileList | null) => {
      if (!fileList?.[0]) {
        return;
      }

      try {
        const [part] = await convertFilesToParts([fileList[0]]);

        if (!part) {
          throw new Error("Reference image could not be prepared.");
        }

        updateNode(nodeId, {
          image: toReferenceImage(fileList[0], part.url),
        });
      } catch (error) {
        setManualError(
          error instanceof Error
            ? error.message
            : "Reference image could not be prepared."
        );
      }
    },
    [setManualError, updateNode]
  );
}

function useManualWorkflowRun({
  graphRef,
  isChatAvailable,
  isGraphLocked,
  productTelemetry,
  setGraph,
  setIsManualRunPending,
  setManualError,
}: {
  graphRef: RefObject<WorkflowGraph>;
  isChatAvailable: boolean;
  isGraphLocked: boolean;
  productTelemetry: ImageWorkflowProductTelemetry;
  setGraph: Dispatch<SetStateAction<WorkflowGraph>>;
  setIsManualRunPending: Dispatch<SetStateAction<boolean>>;
  setManualError: SetManualError;
}) {
  return useCallback(async () => {
    if (isGraphLocked || !isChatAvailable) {
      return;
    }

    setIsManualRunPending(true);
    setManualError(null);

    try {
      const submittedGraph = graphRef.current;
      const response = await fetch("/api/demos/image-workflow-agent/run", {
        body: JSON.stringify({ graph: submittedGraph }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        graph?: WorkflowGraph;
      };

      if (!(response.ok && payload.graph)) {
        throw new Error(payload.error ?? "Workflow run failed.");
      }

      const acceptedGraph = payload.graph as WorkflowGraph;
      commitAcceptedWorkflowGraph(graphRef, acceptedGraph, setGraph);
      productTelemetry.onAcceptedAction({
        action: "run_workflow",
        hasReferenceImage: Boolean(
          getRunnableWorkflowState(submittedGraph).referenceImage
        ),
        source: "manual",
      });
    } catch (error) {
      setManualError(
        error instanceof Error ? error.message : "Workflow run failed."
      );
    } finally {
      setIsManualRunPending(false);
    }
  }, [
    graphRef,
    isChatAvailable,
    isGraphLocked,
    productTelemetry,
    setGraph,
    setIsManualRunPending,
    setManualError,
  ]);
}

export function useImageWorkflowAgent(options: {
  isChatAvailable: boolean;
  productTelemetry?: ImageWorkflowProductTelemetry;
}) {
  const productTelemetry =
    options.productTelemetry ?? noopImageWorkflowProductTelemetry;
  const [graph, setGraph] = useState(createDefaultWorkflowGraph);
  const [manualError, setManualError] = useState<string | null>(null);
  const [isManualRunPending, setIsManualRunPending] = useState(false);
  const graphRef = useRef(graph);
  const consumedAgentActionIds = useRef(new Set<string>());
  const [chat] = useState(() =>
    createImageWorkflowChat(() => graphRef.current)
  );
  const { clearError, error, messages, regenerate, sendMessage, status } =
    useChat({ chat });
  const retryConversationError = useConversationErrorRetry({
    clearError,
    regenerate,
  });
  const resultNode = getImageResultNode(graph);
  const isBusy =
    status === "submitted" || status === "streaming" || isManualRunPending;
  const isGraphLocked = isBusy || resultNode.data.status === "running";
  const mutateGraph = useGraphMutator({
    graphRef,
    isGraphLocked,
    productTelemetry,
    setGraph,
    setManualError,
  });
  const editingActions = useWorkflowEditingActions(mutateGraph);
  const uploadReferenceImage = useReferenceImageUpload({
    setManualError,
    updateNode: editingActions.updateNode,
  });
  const runWorkflow = useManualWorkflowRun({
    graphRef,
    isChatAvailable: options.isChatAvailable,
    isGraphLocked,
    productTelemetry,
    setGraph,
    setIsManualRunPending,
    setManualError,
  });

  useEffect(() => {
    const nextGraph = getLatestWorkflowGraph(messages);

    for (const acceptedAction of getUnconsumedWorkflowActions(
      messages,
      consumedAgentActionIds.current
    )) {
      consumedAgentActionIds.current.add(acceptedAction.id);
      productTelemetry.onAcceptedAction(acceptedAction.action);
    }

    if (!nextGraph || nextGraph.revision <= graphRef.current.revision) {
      return;
    }

    commitAcceptedWorkflowGraph(graphRef, nextGraph, setGraph);
    setManualError(null);
  }, [messages, productTelemetry]);

  const sendChatMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();

      if (!trimmedText || isGraphLocked || !options.isChatAvailable) {
        return;
      }

      setManualError(null);
      await dispatchAcceptedImageWorkflowAction(
        {
          action: "send_message",
          source: "manual",
        },
        () => sendMessage({ text: trimmedText }),
        productTelemetry
      );
    },
    [isGraphLocked, options.isChatAvailable, productTelemetry, sendMessage]
  );

  const trackManualWorkflowModification = useCallback(() => {
    productTelemetry.onAcceptedAction({
      action: "modify_workflow",
      source: "manual",
    });
  }, [productTelemetry]);

  return {
    ...editingActions,
    clearManualError: () => setManualError(null),
    error,
    graph,
    hasMessages: messages.length > 0,
    isBusy,
    isChatStreaming: status === "submitted" || status === "streaming",
    isGraphLocked,
    isManualRunPending,
    manualError,
    messages,
    retryConversationError,
    runWorkflow,
    sendChatMessage,
    status,
    suggestions: imageWorkflowAgentSuggestions,
    trackManualWorkflowModification,
    uploadReferenceImage,
  };
}
