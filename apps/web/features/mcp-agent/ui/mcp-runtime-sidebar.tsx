"use client";

import { Badge } from "@workspace/ui/components/badge";

import type {
  ConfiguredMcpServer,
  McpAgentRuntimeState,
} from "../server/runtime";

interface McpRuntimeSidebarProps {
  configuredServers: ConfiguredMcpServer[];
  configuredTools: McpAgentRuntimeState["configuredTools"];
  nodeVersion: string;
}

export function McpRuntimeSidebar({
  configuredServers,
  configuredTools,
  nodeVersion,
}: McpRuntimeSidebarProps) {
  return (
    <aside className="border border-foreground/10 bg-background p-4 lg:h-full lg:min-h-0 lg:overflow-y-auto">
      <div className="space-y-5">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Runtime
          </p>
          <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
          <p className="mt-1 text-muted-foreground text-sm">
            AI SDK MCP client
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Connected MCP servers
          </p>
          {configuredServers.map((server) => (
            <div
              className="space-y-2 border border-foreground/10 p-3"
              key={server.name}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-sm">{server.name}</p>
                <Badge variant="secondary">{server.transport}</Badge>
              </div>
              <p className="text-muted-foreground text-sm/relaxed">
                {server.description}
              </p>
              <p className="text-muted-foreground text-xs">
                {server.requiredSetup}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Available tools
          </p>
          {configuredTools.map((tool) => (
            <div
              className="space-y-1 border border-foreground/10 p-3"
              key={tool.name}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-sm">{tool.name}</p>
                <Badge variant="outline">{tool.server}</Badge>
              </div>
              <p className="text-muted-foreground text-sm/relaxed">
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
