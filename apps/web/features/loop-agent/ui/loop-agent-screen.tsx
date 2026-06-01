import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getLoopAgentRuntimeState } from "@/features/loop-agent/server/runtime";
import { runSupportTriageLoop } from "@/features/loop-agent/server/support-triage";
import { LoopAgentWorkspace } from "@/features/loop-agent/ui/loop-agent-workspace";

export function LoopAgentScreen() {
  const runtimeState = getLoopAgentRuntimeState();
  const triage = runSupportTriageLoop();

  return (
    <DemoWorkspaceShell
      badges={[runtimeState.statusLabel, runtimeState.chatModel]}
      breadcrumbTitle="Loop Agent"
      summary="This slice turns the official AI SDK tool-calling and loop-control recipes into an inspectable support workflow: independent context lookups, a dependent SLA decision, a human approval checkpoint, and a bounded agent loop."
      title="Multi-step support triage agent with human approval"
    >
      <LoopAgentWorkspace
        chatModel={runtimeState.chatModel}
        isChatAvailable={runtimeState.isChatAvailable}
        nodeVersion={runtimeState.nodeVersion}
        setupMessage={runtimeState.setupMessage}
        triage={triage}
      />
    </DemoWorkspaceShell>
  );
}
