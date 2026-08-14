import { TooltipProvider } from "@workspace/ui/components/tooltip";

import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getMinimalChatAgentRuntimeState } from "../server/runtime";
import { MinimalChatAgentWorkspace } from "./minimal-chat-agent-workspace";

export function MinimalChatAgentScreen() {
  const runtimeState = getMinimalChatAgentRuntimeState();

  return (
    <TooltipProvider>
      <DemoWorkspaceShell
        badges={[runtimeState.statusLabel, runtimeState.chatModel]}
        breadcrumbClassName="font-heading text-xs tracking-[0.16em]"
        breadcrumbTitle="Minimal Chat Agent"
        headerFrame="card"
        summary="A source-backed minimal agent that combines hosted web search, a public GitHub repository tool, and a client-rendered questionnaire whose answers resume the same AI SDK tool loop."
        title="A minimal agent that knows when to search, inspect, or ask"
      >
        <MinimalChatAgentWorkspace
          chatModel={runtimeState.chatModel}
          isChatAvailable={runtimeState.isChatAvailable}
          nodeVersion={runtimeState.nodeVersion}
          setupMessage={runtimeState.setupMessage}
        />
      </DemoWorkspaceShell>
    </TooltipProvider>
  );
}
