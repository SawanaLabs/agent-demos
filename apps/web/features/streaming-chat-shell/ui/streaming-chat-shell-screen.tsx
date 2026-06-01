import { Badge } from "@workspace/ui/components/badge";
import { DemoBreadcrumb } from "@/components/demo-breadcrumb";

import { getStreamingChatShellRuntimeState } from "@/features/streaming-chat-shell/server/runtime";

import { StreamingChatShellWorkspace } from "./streaming-chat-shell-workspace";

export function StreamingChatShellScreen() {
  const runtimeState = getStreamingChatShellRuntimeState();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <DemoBreadcrumb title="Streaming Chat Shell" />
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              A developer-facing chat runtime shell with replayable streaming
              trace
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              This demo shows how one chat session can drive the user-facing
              transcript and a developer-side replay stream at the same time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
          </div>
        </header>

        <div className="lg:h-svh">
          <StreamingChatShellWorkspace
            chatModel={runtimeState.chatModel}
            isChatAvailable={runtimeState.isChatAvailable}
            nodeVersion={runtimeState.nodeVersion}
            setupMessage={runtimeState.setupMessage}
            supportedAudiences={runtimeState.supportedAudiences}
          />
        </div>
      </div>
    </main>
  );
}
