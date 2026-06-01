import { Badge } from "@/components/ui/badge";

import { getRagChatbotRuntimeState } from "@/lib/rag-chatbot/runtime";
import { RagChatbotWorkspace } from "@/components/rag-chatbot/rag-chatbot-workspace";

export async function RagChatbotScreen() {
  const runtimeState = await getRagChatbotRuntimeState();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Demo / RAG Chatbot
            </p>
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              Grounded document support chat over a preindexed design manual
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              This slice turns the official AI SDK RAG recipe into a website
              support chatbot: retrieval-first answers, visible tool state, and
              source snippets tied to a durable pgvector store.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
          </div>
        </header>

        <div className="lg:h-svh">
          <RagChatbotWorkspace
            chatModel={runtimeState.chatModel}
            isChatAvailable={runtimeState.isChatAvailable}
            nodeVersion={runtimeState.nodeVersion}
            sourceDocument={runtimeState.sourceDocument}
            setupMessage={runtimeState.setupMessage}
          />
        </div>
      </div>
    </main>
  );
}
