import { Badge } from "@workspace/ui/components/badge";
import { DemoBreadcrumb } from "@/components/demo-breadcrumb";

import { getMultimodalChatbotRuntimeState } from "@/features/multimodal-chatbot/server/runtime";
import { MultimodalChatbotWorkspace } from "@/features/multimodal-chatbot/ui/multimodal-chatbot-workspace";

export function MultimodalChatbotScreen() {
  const runtimeState = getMultimodalChatbotRuntimeState();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <DemoBreadcrumb title="Multi-Modal Chatbot" />
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              Ad-hoc file chat over user-provided images and PDFs
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              This slice keeps the official AI SDK multimodal guide recognizable
              while turning it into a workspace for immediate image and PDF
              questions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
          </div>
        </header>

        <div className="lg:h-svh">
          <MultimodalChatbotWorkspace
            acceptedMediaTypes={runtimeState.acceptedMediaTypes}
            chatModel={runtimeState.chatModel}
            isChatAvailable={runtimeState.isChatAvailable}
            nodeVersion={runtimeState.nodeVersion}
            setupMessage={runtimeState.setupMessage}
          />
        </div>
      </div>
    </main>
  );
}
