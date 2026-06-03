import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";

import { getRagChatbotRuntimeState } from "@/lib/rag-chatbot/runtime";
import { RagChatbotWorkspace } from "@/components/rag-chatbot/rag-chatbot-workspace";

export async function RagChatbotScreen() {
  const runtimeState = await getRagChatbotRuntimeState();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <Breadcrumb>
              <BreadcrumbList className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    aria-label="Back to demos"
                    className="-ml-1 inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                    href="/"
                  >
                    <ArrowLeft aria-hidden="true" className="size-3.5 shrink-0" />
                    <span>Demo</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-muted-foreground">
                  /
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-normal text-muted-foreground">
                    RAG Chatbot
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              Grounded document support chat over a portable design manual index
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              This slice turns the official AI SDK RAG recipe into a website
              support chatbot: retrieval-first answers, visible tool state, and
              source snippets that work out of the box with an optional
              pgvector upgrade path.
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
            retrievalLabel={runtimeState.retrievalLabel}
            sourceDocument={runtimeState.sourceDocument}
            setupMessage={runtimeState.setupMessage}
          />
        </div>
      </div>
    </main>
  );
}
