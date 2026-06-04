import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

import {
  getUltraChatbotAgentRuntimeState,
  type UltraChatbotAgentRuntimeState,
} from "@/lib/ultra-chatbot-agent/server/runtime";
import type { UltraChatbotAgentScreenData } from "@/lib/ultra-chatbot-agent/server/session";
import { UltraChatbotAgentWorkspace } from "./ultra-chatbot-agent-workspace";

interface UltraChatbotAgentScreenProps extends UltraChatbotAgentScreenData {
  runtimeState?: UltraChatbotAgentRuntimeState;
}

export function UltraChatbotAgentScreen({
  draftChatId,
  initialHistoryPage,
  initialSession,
  runtimeState = getUltraChatbotAgentRuntimeState(),
}: UltraChatbotAgentScreenProps) {
  return (
    <TooltipProvider>
      <DemoWorkspaceShell
        badges={[
          runtimeState.statusLabel,
          runtimeState.chatModel,
          "Model selector",
        ]}
        headerClassName="shrink-0"
        summary={
          <>
            A route-backed port of the pinned <code>vercel/ai-chatbot</code>{" "}
            snapshot. This first slice already owns visitor isolation, model
            selection, Postgres persistence, and resumable streams.
          </>
        }
        title="Ultra Chatbot Agent"
      >
        <UltraChatbotAgentWorkspace
          defaultChatModel={runtimeState.chatModel}
          draftChatId={draftChatId}
          initialHistoryPage={initialHistoryPage}
          initialSession={initialSession}
          isChatAvailable={runtimeState.isChatAvailable}
          key={initialSession?.chat.id ?? draftChatId}
          models={runtimeState.models}
          nodeVersion={runtimeState.nodeVersion}
          setupMessage={runtimeState.setupMessage}
        />
      </DemoWorkspaceShell>
    </TooltipProvider>
  );
}
