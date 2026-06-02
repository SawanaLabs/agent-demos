import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getFoundationChatRuntimeState } from "@/features/foundation-chat/server/runtime";
import { FoundationChatWorkspace } from "@/features/foundation-chat/ui/foundation-chat-workspace";

export function FoundationChatScreen() {
  const runtimeState = getFoundationChatRuntimeState();

  return (
    <TooltipProvider>
      <DemoWorkspaceShell
        badges={[runtimeState.statusLabel, runtimeState.chatModel]}
        breadcrumbClassName="font-heading text-xs tracking-[0.16em]"
        breadcrumbTitle="Foundation Chat"
        headerFrame="card"
        summary="This first slot validates the shared route pattern, environment contract, and AI Elements workspace before the cookbook batches start branching into larger agents."
        title="Production-ready AI Gateway chat shell for the rest of the demos"
      >
        <FoundationChatWorkspace
          chatModel={runtimeState.chatModel}
          isChatAvailable={runtimeState.isChatAvailable}
          nodeVersion={runtimeState.nodeVersion}
          setupMessage={runtimeState.setupMessage}
        />
      </DemoWorkspaceShell>
    </TooltipProvider>
  );
}
