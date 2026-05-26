import { Badge } from "@workspace/ui/components/badge";

import {
  getUltraChatbotAgentRuntimeState,
  type UltraChatbotAgentRuntimeState,
} from "../server/runtime";
import type { UltraChatbotAgentScreenData } from "../server/session";
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
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Demo / Ultra Chatbot Agent
            </p>
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              Ultra Chatbot Agent
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              A route-backed port of the pinned <code>vercel/ai-chatbot</code>{" "}
              snapshot. This first slice already owns visitor isolation, model
              selection, Postgres persistence, and resumable streams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
            <Badge variant="outline">Model selector</Badge>
          </div>
        </header>

        <UltraChatbotAgentWorkspace
          defaultChatModel={runtimeState.chatModel}
          draftChatId={draftChatId}
          initialHistoryPage={initialHistoryPage}
          initialSession={initialSession}
          isChatAvailable={runtimeState.isChatAvailable}
          models={runtimeState.models}
          nodeVersion={runtimeState.nodeVersion}
          setupMessage={runtimeState.setupMessage}
        />
      </div>
    </main>
  );
}
