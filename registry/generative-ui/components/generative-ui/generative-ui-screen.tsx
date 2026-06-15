import { TooltipProvider } from "@/components/ui/tooltip";

import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";
import { getGenerativeUiRuntimeState } from "@/lib/generative-ui/runtime";
import { GenerativeUiWorkspace } from "@/components/generative-ui/generative-ui-workspace";

export function GenerativeUiScreen() {
  const runtimeState = getGenerativeUiRuntimeState();

  return (
    <TooltipProvider>
      <DemoWorkspaceShell
        badges={[runtimeState.statusLabel, runtimeState.chatModel]}
        breadcrumbClassName="font-heading text-xs tracking-[0.16em]"
        breadcrumbTitle="Generative UI"
        headerFrame="card"
        summary="A chat workspace where the model can use hosted web search when recency matters, then render either a comparison matrix or recommendation card through AI SDK UI tool parts."
        title="Model-selected interface components inside the message stream"
      >
        <GenerativeUiWorkspace
          chatModel={runtimeState.chatModel}
          isChatAvailable={runtimeState.isChatAvailable}
          nodeVersion={runtimeState.nodeVersion}
          setupMessage={runtimeState.setupMessage}
        />
      </DemoWorkspaceShell>
    </TooltipProvider>
  );
}
