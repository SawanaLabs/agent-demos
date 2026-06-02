import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getLangGraphAgentRuntimeState } from "@/features/langgraph-agent/server/runtime";
import { LangGraphAgentWorkspace } from "@/features/langgraph-agent/ui/langgraph-agent-workspace";

export function LangGraphAgentScreen() {
  const runtimeState = getLangGraphAgentRuntimeState();

  return (
    <TooltipProvider>
      <DemoWorkspaceShell
        badges={[
          runtimeState.statusLabel,
          runtimeState.modelName,
          runtimeState.assistantId ?? "assistant id missing",
        ]}
        breadcrumbClassName="font-heading text-xs tracking-[0.16em]"
        breadcrumbTitle="LangGraph Agent"
        headerFrame="card"
        summary="This demo validates the copyable frontend slice for teams that already run Python LangGraph agents and want a full-stack product surface."
        title="Official LangGraph thread streaming in a Next.js AI Elements workspace"
      >
        <LangGraphAgentWorkspace
          assistantId={runtimeState.assistantId}
          isChatAvailable={runtimeState.isChatAvailable}
          nodeVersion={runtimeState.nodeVersion}
          remoteUrl={runtimeState.remoteUrl}
          setupMessage={runtimeState.setupMessage}
        />
      </DemoWorkspaceShell>
    </TooltipProvider>
  );
}
