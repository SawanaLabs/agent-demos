"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";

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
  let status: "error" | "ready" | "setup required" | "streaming" =
    setupState.isReady ? "ready" : "setup required";

  if (controller.error || controller.manualError) {
    status = "error";
  }

  if (controller.isBusy) {
    status = "streaming";
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col gap-0 lg:gap-4">
      <div className="hidden flex-wrap items-center justify-between gap-3 border border-foreground/10 bg-background px-4 py-3 lg:flex">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Revision {controller.graph.revision}</Badge>
          <Badge variant="outline">
            {referenceNode ? "Reference attached" : "Prompt only"}
          </Badge>
          <Badge variant="outline">{resultNode.data.status}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={controller.isGraphLocked || Boolean(referenceNode)}
            onClick={controller.addReferenceNode}
            size="sm"
            type="button"
            variant="outline"
          >
            Add reference
          </Button>
          <Button
            disabled={controller.isGraphLocked}
            onClick={controller.resetWorkflow}
            size="sm"
            type="button"
            variant="outline"
          >
            Reset
          </Button>
          <Separator className="hidden h-6 md:block" orientation="vertical" />
          <Button
            disabled={controller.isGraphLocked || !setupState.isReady}
            onClick={() => {
              void controller.runWorkflow();
            }}
            size="sm"
            type="button"
          >
            Run workflow
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(22rem,3fr)]">
        <div className="hidden min-h-0 lg:block">
          <ImageWorkflowAgentCanvas
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
