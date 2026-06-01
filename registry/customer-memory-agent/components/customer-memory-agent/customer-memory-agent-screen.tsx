import { Badge } from "@/components/ui/badge";

import { customerMemoryProfiles } from "@/lib/customer-memory-agent/customer-profiles";
import { getCustomerMemoryRuntimeState } from "@/lib/customer-memory-agent/runtime";
import { CustomerMemoryAgentWorkspace } from "./customer-memory-agent-workspace";

export function CustomerMemoryAgentScreen() {
  const runtimeState = getCustomerMemoryRuntimeState();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[92rem] flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Demo / Memory & Persistence Agent
            </p>
            <h1 className="max-w-4xl font-medium text-2xl tracking-tight">
              Persist threads, explicit memories, and handoff compactions across
              sessions
            </h1>
            <p className="max-w-4xl text-muted-foreground text-sm/relaxed">
              This Batch 6 workspace shows the long-lived agent layer: the chat
              thread is restored from Postgres, the agent explicitly saves
              durable memories through a tool call, and older context is
              compacted into a handoff checkpoint once the message threshold is
              crossed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
            <Badge variant="outline">
              {runtimeState.compactionThreshold} messages to compact
            </Badge>
          </div>
        </header>

        <div className="xl:h-svh">
          <CustomerMemoryAgentWorkspace
            chatModel={runtimeState.chatModel}
            compactionThreshold={runtimeState.compactionThreshold}
            customers={customerMemoryProfiles}
            isChatAvailable={runtimeState.isChatAvailable}
            nodeVersion={runtimeState.nodeVersion}
            setupMessage={runtimeState.setupMessage}
          />
        </div>
      </div>
    </main>
  );
}
