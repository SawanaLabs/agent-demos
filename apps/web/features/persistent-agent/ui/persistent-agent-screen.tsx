import { Badge } from "@workspace/ui/components/badge";

import {
  getPersistentAgentRuntimeState,
  type PersistentAgentRuntimeState,
} from "../server/runtime";
import type { PersistentAgentScreenData } from "../server/session";
import { PersistentAgentWorkspace } from "./persistent-agent-workspace";

interface PersistentAgentScreenProps extends PersistentAgentScreenData {
  runtimeState?: PersistentAgentRuntimeState;
}

export function PersistentAgentScreen({
  draftChatId,
  initialSession,
  recentChats,
  runtimeState = getPersistentAgentRuntimeState(),
}: PersistentAgentScreenProps) {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Demo / Persistent &amp; Resume Agent
            </p>
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              Persistent &amp; Resume Agent
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              This demo focuses on one contract: a chat becomes an addressable
              resource at <code>/demos/persistent-agent/[id]</code>, survives
              refresh, and keeps its visitor-private identity through a
              server-set cookie.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
            <Badge variant="outline">Redis resume</Badge>
          </div>
        </header>

        <div className="lg:h-svh">
          <PersistentAgentWorkspace
            chatModel={runtimeState.chatModel}
            draftChatId={draftChatId}
            initialSession={initialSession}
            isChatAvailable={runtimeState.isChatAvailable}
            nodeVersion={runtimeState.nodeVersion}
            recentChats={recentChats}
            setupMessage={runtimeState.setupMessage}
          />
        </div>
      </div>
    </main>
  );
}
