"use client";

import type { ImageWorkflowAgentSetupState } from "../server/env";
import { ImageWorkflowAgentCanvas } from "./image-workflow-agent-canvas";
import { ImageWorkflowAgentChatRail } from "./image-workflow-agent-chat-rail";
import {
  getImageResultNode,
  getReferenceImageNode,
} from "./image-workflow-agent-model";
import { useImageWorkflowAgent } from "./use-image-workflow-agent";

export function ImageWorkflowAgentWorkspace({
  setupState,
}: {
  setupState: ImageWorkflowAgentSetupState;
}) {
  const controller = useImageWorkflowAgent({
    isChatAvailable: setupState.isReady,
  });
  const referenceNode = getReferenceImageNode(controller.graph);
  const resultNode = getImageResultNode(controller.graph);
  const hasReference = Boolean(referenceNode);
  let status: "error" | "ready" | "setup required" | "streaming" =
    setupState.isReady ? "ready" : "setup required";

  if (controller.error || controller.manualError) {
    status = "error";
  }

  if (controller.isBusy) {
    status = "streaming";
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(22rem,3fr)]">
        <div className="hidden min-h-0 lg:block">
          <ImageWorkflowAgentCanvas
            controls={{
              canAddReference: !(controller.isGraphLocked || hasReference),
              canReset: !controller.isGraphLocked,
              canRun: !controller.isGraphLocked && setupState.isReady,
              hasReference,
              isRunning:
                controller.isManualRunPending ||
                resultNode.data.status === "running",
              onAddReference: controller.addReferenceNode,
              onReset: controller.resetWorkflow,
              onRun: () => {
                void controller.runWorkflow();
              },
              resultStatus: resultNode.data.status,
              revision: controller.graph.revision,
            }}
            disabled={controller.isGraphLocked}
            graph={controller.graph}
            imageModel={setupState.config.imageModel}
            onConnect={controller.handleConnect}
            onDeleteReferenceNode={controller.deleteNode}
            onGeneratorAspectRatioChange={(nodeId, value) =>
              controller.updateNode(nodeId, { aspectRatio: value })
            }
            onGeneratorPromptChange={(nodeId, value) =>
              controller.updateNode(nodeId, { prompt: value })
            }
            onNodesChange={controller.handleNodesChange}
            onReferenceImageClear={(nodeId) =>
              controller.updateNode(nodeId, { image: null })
            }
            onReferenceImageUpload={controller.uploadReferenceImage}
            onReferenceLabelChange={(nodeId, value) =>
              controller.updateNode(nodeId, { label: value })
            }
          />
        </div>

        <div className="min-h-0">
          <ImageWorkflowAgentChatRail
            chatError={controller.error}
            hasMessages={controller.hasMessages}
            isBusy={controller.isBusy}
            isChatAvailable={setupState.isReady}
            manualError={controller.manualError}
            messageStatus={controller.status}
            messages={controller.messages}
            onRetryChatError={controller.retryConversationError}
            onSend={controller.sendChatMessage}
            onSuggestionClick={controller.sendChatMessage}
            resultNode={resultNode}
            setupState={setupState}
            status={status}
            suggestions={controller.suggestions}
          />
        </div>
      </div>
    </section>
  );
}
