import { Badge } from "@workspace/ui/components/badge";

import { getFoundationChatRuntimeState } from "@/features/foundation-chat/server/runtime";
import { FoundationChatWorkspace } from "@/features/foundation-chat/ui/foundation-chat-workspace";

export function FoundationChatScreen() {
  const runtimeState = getFoundationChatRuntimeState();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Demo / Foundation Chat
            </p>
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              Production-ready AI Gateway chat shell for the rest of the demos
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              This first slot validates the shared route pattern, environment
              contract, and AI Elements workspace before the cookbook batches
              start branching into larger agents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
          </div>
        </header>

        <FoundationChatWorkspace
          chatModel={runtimeState.chatModel}
          isChatAvailable={runtimeState.isChatAvailable}
          nodeVersion={runtimeState.nodeVersion}
          setupMessage={runtimeState.setupMessage}
        />
      </div>
    </main>
  );
}
