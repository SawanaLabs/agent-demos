"use client";

import type { ImageWorkflowAgentSetupState } from "@/features/image-workflow-agent/server/env";
import { ImageWorkflowAgentWorkspace } from "@/features/image-workflow-agent/ui/image-workflow-agent-workspace";
import { createImageWorkflowProductTelemetry } from "./image-workflow-adapter";

const productTelemetry = createImageWorkflowProductTelemetry();

export function HostedImageWorkflowAgentWorkspace({
  setupState,
}: {
  setupState: ImageWorkflowAgentSetupState;
}) {
  return (
    <ImageWorkflowAgentWorkspace
      productTelemetry={productTelemetry}
      setupState={setupState}
    />
  );
}
