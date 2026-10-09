import { TooltipProvider } from "@workspace/ui/components/tooltip";

import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getMultiAgentExplorerRuntimeState } from "../server/runtime";
import { MultiAgentExplorerWorkspace } from "./multi-agent-explorer-workspace";

export function MultiAgentExplorerScreen() {
  const runtimeState = getMultiAgentExplorerRuntimeState();

  return (
    <TooltipProvider>
      <DemoWorkspaceShell
        badges={[runtimeState.statusLabel, runtimeState.chatModel]}
        breadcrumbClassName="font-heading text-xs tracking-[0.16em]"
        breadcrumbTitle="Multi-Agent Explorer"
        headerFrame="card"
        summary="A lead agent decomposes a research question into subtopics, fans them out to explorer subagents that run their own tool loops in parallel, then synthesizes the findings — the whole orchestration stays visible in the chat stream."
        title="A lead agent that delegates research to parallel subagents"
      >
        <MultiAgentExplorerWorkspace
          chatModel={runtimeState.chatModel}
          isChatAvailable={runtimeState.isChatAvailable}
          nodeVersion={runtimeState.nodeVersion}
          setupMessage={runtimeState.setupMessage}
        />
      </DemoWorkspaceShell>
    </TooltipProvider>
  );
}
