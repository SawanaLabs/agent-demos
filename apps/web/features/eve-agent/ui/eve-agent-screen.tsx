import { TooltipProvider } from "@workspace/ui/components/tooltip";

import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getEveAgentRuntimeState } from "../server/runtime";
import { EveAgentWorkspace } from "./eve-agent-workspace";

export async function EveAgentScreen() {
  const runtimeState = await getEveAgentRuntimeState();

  return (
    <TooltipProvider>
      <DemoWorkspaceShell
        badges={[
          runtimeState.statusLabel,
          runtimeState.chatModel,
          "eve (beta)",
        ]}
        breadcrumbClassName="font-heading text-xs tracking-[0.16em]"
        breadcrumbTitle="Eve Agent"
        headerFrame="card"
        summary="A service-triage chat agent running on Vercel's eve framework (beta). Every turn drives eve's agent loop — plan a step, call a tool, observe, repeat — and each loop step renders in the conversation."
        title="An eve agent loop you can watch work"
      >
        <EveAgentWorkspace
          chatModel={runtimeState.chatModel}
          eveStatus={runtimeState.eveStatus}
          isChatAvailable={runtimeState.isChatAvailable}
          nodeVersion={runtimeState.nodeVersion}
          setupMessage={runtimeState.setupMessage}
        />
      </DemoWorkspaceShell>
    </TooltipProvider>
  );
}
