"use client";

import { Badge } from "@workspace/ui/components/badge";
import { PageText } from "@/components/page-copy";

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
            <PageText>{"Runtime"}</PageText>
          </p>
          <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
          <p className="mt-1 text-muted-foreground text-sm">
            {sandboxProvider}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            <PageText>{"Configured tools"}</PageText>
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
            <PageText>{"Preview contract"}</PageText>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">
              <PageText>{"port "}</PageText>
              {previewPort}
            </Badge>
            <Badge variant="secondary">
              <PageText>{"HTML / CSS / JS"}</PageText>
            </Badge>
            <Badge variant="secondary">
              <PageText>{"live iframe"}</PageText>
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            <PageText>{"Source core"}</PageText>
          </p>
          <p className="mt-1 text-sm">
            <PageText>
              {
                "The model writes code in a persistent sandbox workspace, uses bash and direct file tools for iteration, then calls"
              }
            </PageText>
            <PageText> </PageText>
            <code>startPreview</code>
            <PageText>{" to publish the generated prototype."}</PageText>
          </p>
        </div>
      </div>
    </aside>
  );
}
