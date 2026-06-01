import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getObjectGenerationRuntimeState } from "@/features/object-generation/server/runtime";

import { ObjectGenerationWorkspace } from "./object-generation-workspace";

export function ObjectGenerationScreen() {
  const runtimeState = getObjectGenerationRuntimeState();

  return (
    <DemoWorkspaceShell
      badges={[runtimeState.statusLabel, runtimeState.chatModel]}
      breadcrumbTitle="Object Generation"
      summary="This slice keeps AI SDK structured output front and center: multimodal inputs go in, and the generated object progressively renders inside the assistant card in the thread."
      title="Generate a structured object directly inside the assistant message"
    >
      <ObjectGenerationWorkspace
        acceptedMediaTypes={runtimeState.acceptedMediaTypes}
        chatModel={runtimeState.chatModel}
        isReviewAvailable={runtimeState.isReviewAvailable}
        nodeVersion={runtimeState.nodeVersion}
        setupMessage={runtimeState.setupMessage}
      />
    </DemoWorkspaceShell>
  );
}
