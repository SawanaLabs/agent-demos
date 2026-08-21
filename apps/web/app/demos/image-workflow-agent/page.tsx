import { getImageWorkflowAgentSetupState } from "@/features/image-workflow-agent/server/env";
import { ImageWorkflowAgentScreen } from "@/features/image-workflow-agent/ui/image-workflow-agent-screen";
import { HostedImageWorkflowAgentWorkspace } from "@/features/site-analytics/client/hosted-image-workflow-agent-workspace";

export const dynamic = "force-dynamic";

export default function ImageWorkflowAgentPage() {
  const setupState = getImageWorkflowAgentSetupState();

  return (
    <ImageWorkflowAgentScreen setupState={setupState}>
      <HostedImageWorkflowAgentWorkspace setupState={setupState} />
    </ImageWorkflowAgentScreen>
  );
}
