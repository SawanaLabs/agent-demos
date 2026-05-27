"use client";

import { Badge } from "@/components/ui/badge";

import { configuredTools } from "./sandbox-agent-model";

interface SandboxRuntimeSidebarProps {
  nodeVersion: string;
  previewPort: number;
  sandboxProvider: string;
}

export function SandboxRuntimeSidebar({
  nodeVersion,
  previewPort,
  sandboxProvider,
}: SandboxRuntimeSidebarProps) {
  return (
    <aside className="border border-foreground/10 bg-background p-4">
      <div className="space-y-5">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Runtime
          </p>
          <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
          <p className="mt-1 text-muted-foreground text-sm">
            {sandboxProvider}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Configured tools
          </p>
          {configuredTools.map((tool) => (
            <div
              className="space-y-1 border border-foreground/10 p-3"
              key={tool.name}
            >
              <p className="font-medium text-sm">{tool.name}</p>
              <p className="text-muted-foreground text-sm/relaxed">
                {tool.description}
              </p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Preview contract
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">port {previewPort}</Badge>
            <Badge variant="secondary">HTML / CSS / JS</Badge>
            <Badge variant="secondary">live iframe</Badge>
          </div>
        </div>

        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Source core
          </p>
          <p className="mt-1 text-sm">
            The model writes code in a persistent sandbox workspace, uses bash
            and direct file tools for iteration, then calls{" "}
            <code>startPreview</code> to publish the generated prototype.
          </p>
        </div>
      </div>
    </aside>
  );
}
