import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getMcpAgentRuntimeState } from "@/features/mcp-agent/server/runtime";
import { McpAgentWorkspace } from "@/features/mcp-agent/ui/mcp-agent-workspace";

export function McpAgentScreen() {
  const runtimeState = getMcpAgentRuntimeState();

  return (
    <DemoWorkspaceShell
      badges={[runtimeState.statusLabel, runtimeState.chatModel]}
      breadcrumbTitle="MCP Runtime Doctor Agent"
      summary="This workspace connects AI SDK MCP clients to a built-in project docs server and an optional Next.js dev MCP server, then exposes the discovered tools to a ToolLoopAgent."
      title="Ask one agent to inspect project docs and local Next.js runtime state through MCP"
    >
      <McpAgentWorkspace
        chatModel={runtimeState.chatModel}
        configuredServers={runtimeState.configuredServers}
        configuredTools={runtimeState.configuredTools}
        isChatAvailable={runtimeState.isChatAvailable}
        nodeVersion={runtimeState.nodeVersion}
        setupMessage={runtimeState.setupMessage}
      />
    </DemoWorkspaceShell>
  );
}
