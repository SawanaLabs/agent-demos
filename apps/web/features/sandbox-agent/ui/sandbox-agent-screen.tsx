import { Badge } from "@workspace/ui/components/badge";

import { getSandboxAgentRuntimeState } from "@/features/sandbox-agent/server/runtime";
import { SandboxAgentWorkspace } from "@/features/sandbox-agent/ui/sandbox-agent-workspace";

export async function SandboxAgentScreen() {
  const runtimeState = await getSandboxAgentRuntimeState();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Demo / Sandbox Workspace Agent
            </p>
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              Build a frontend prototype in an isolated workspace and expose the
              live result
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              This workspace gives one persistent Vercel Sandbox to each chat,
              lets the model write HTML, CSS, and JavaScript files, and renders
              the generated app through AI Elements WebPreview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
          </div>
        </header>

        <SandboxAgentWorkspace
          chatModel={runtimeState.chatModel}
          isChatAvailable={runtimeState.isChatAvailable}
          nodeVersion={runtimeState.nodeVersion}
          previewPort={runtimeState.previewPort}
          sandboxProvider={runtimeState.sandboxProvider}
          setupMessage={runtimeState.setupMessage}
        />
      </div>
    </main>
  );
}
