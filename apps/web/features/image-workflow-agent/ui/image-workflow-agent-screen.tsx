import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getImageWorkflowAgentSetupState } from "../server/env";
import { ImageWorkflowAgentWorkspace } from "./image-workflow-agent-workspace";

export function ImageWorkflowAgentScreen() {
  const setupState = getImageWorkflowAgentSetupState();

  return (
    <DemoWorkspaceShell
      badges={[
        setupState.isReady ? "Ready" : "Setup required",
        setupState.config.chatModel,
        setupState.config.imageModel,
      ]}
      breadcrumbTitle="Image Workflow Agent"
      summary="A restrained canvas workspace for prompt-only generation or reference-image editing, with shared graph mutations from both direct manipulation and agent tool calls."
      title="Image generation and editing through one validated workflow graph"
    >
      <ImageWorkflowAgentWorkspace setupState={setupState} />
    </DemoWorkspaceShell>
  );
}
