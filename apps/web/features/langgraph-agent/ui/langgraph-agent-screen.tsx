import { Badge } from "@workspace/ui/components/badge";
import { Card } from "@workspace/ui/components/card";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { DemoBreadcrumb } from "@/components/demo-breadcrumb";

import { getLangGraphAgentRuntimeState } from "@/features/langgraph-agent/server/runtime";
import { LangGraphAgentWorkspace } from "@/features/langgraph-agent/ui/langgraph-agent-workspace";

export function LangGraphAgentScreen() {
  const runtimeState = getLangGraphAgentRuntimeState();

  return (
    <TooltipProvider>
      <main className="min-h-svh bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
          <Card className="grid gap-4 bg-background px-4 py-5 text-base text-foreground leading-normal md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-2">
              <DemoBreadcrumb
                className="font-heading text-xs tracking-[0.16em]"
                title="LangGraph Agent"
              />
              <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
                Official LangGraph thread streaming in a Next.js AI Elements
                workspace
              </h1>
              <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
                This demo validates the copyable frontend slice for teams that
                already run Python LangGraph agents and want a full-stack
                product surface.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{runtimeState.statusLabel}</Badge>
              <Badge variant="outline">{runtimeState.modelName}</Badge>
              <Badge variant="outline">
                {runtimeState.assistantId ?? "assistant id missing"}
              </Badge>
            </div>
          </Card>

          <LangGraphAgentWorkspace
            assistantId={runtimeState.assistantId}
            isChatAvailable={runtimeState.isChatAvailable}
            nodeVersion={runtimeState.nodeVersion}
            remoteUrl={runtimeState.remoteUrl}
            setupMessage={runtimeState.setupMessage}
          />
        </div>
      </main>
    </TooltipProvider>
  );
}
