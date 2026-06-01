import { Badge } from "@/components/ui/badge";

import { getMcpAgentRuntimeState } from "@/lib/mcp-agent/server/runtime";
import { McpAgentWorkspace } from "./mcp-agent-workspace";

export function McpAgentScreen() {
  const runtimeState = getMcpAgentRuntimeState();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Demo / MCP Runtime Doctor Agent
            </p>
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              Ask one agent to inspect project docs and local Next.js runtime
              state through MCP
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              This workspace connects AI SDK MCP clients to a built-in project
              docs server and an optional Next.js dev MCP server, then exposes
              the discovered tools to a ToolLoopAgent.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
          </div>
        </header>

        <div className="lg:h-svh">
          <McpAgentWorkspace
            chatModel={runtimeState.chatModel}
            configuredServers={runtimeState.configuredServers}
            configuredTools={runtimeState.configuredTools}
            isChatAvailable={runtimeState.isChatAvailable}
            nodeVersion={runtimeState.nodeVersion}
            setupMessage={runtimeState.setupMessage}
          />
        </div>
      </div>
    </main>
  );
}
