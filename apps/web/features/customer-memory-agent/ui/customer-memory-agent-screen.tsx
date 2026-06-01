import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { customerMemoryProfiles } from "../customer-profiles";
import { getCustomerMemoryRuntimeState } from "../server/runtime";
import { CustomerMemoryAgentWorkspace } from "./customer-memory-agent-workspace";

export function CustomerMemoryAgentScreen() {
  const runtimeState = getCustomerMemoryRuntimeState();

  return (
    <DemoWorkspaceShell
      badges={[
        runtimeState.statusLabel,
        runtimeState.chatModel,
        `${runtimeState.compactionThreshold} messages to compact`,
      ]}
      breadcrumbTitle="Memory & Persistence Agent"
      maxWidthClassName="max-w-[92rem]"
      summary="This Batch 6 workspace shows the long-lived agent layer: the chat thread is restored from Postgres, the agent explicitly saves durable memories through a tool call, and older context is compacted into a handoff checkpoint once the message threshold is crossed."
      summaryClassName="max-w-4xl"
      title="Persist threads, explicit memories, and handoff compactions across sessions"
      titleClassName="max-w-4xl"
      workspaceClassName="xl:h-svh"
    >
      <CustomerMemoryAgentWorkspace
        chatModel={runtimeState.chatModel}
        compactionThreshold={runtimeState.compactionThreshold}
        customers={customerMemoryProfiles}
        isChatAvailable={runtimeState.isChatAvailable}
        nodeVersion={runtimeState.nodeVersion}
        setupMessage={runtimeState.setupMessage}
      />
    </DemoWorkspaceShell>
  );
}
