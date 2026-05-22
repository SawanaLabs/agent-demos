import { Badge } from "@workspace/ui/components/badge";

import { getContentReviewRuntimeState } from "@/features/content-review/server/runtime";

import { ContentReviewWorkspace } from "./content-review-workspace";

export function ContentReviewScreen() {
  const runtimeState = getContentReviewRuntimeState();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Demo / Object Generation
            </p>
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              Stream a structured object directly inside the assistant message
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              This slice keeps AI SDK structured output front and center:
              multimodal content-review input goes in, and a review object
              progressively renders the assistant card inside the thread.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
          </div>
        </header>

        <ContentReviewWorkspace
          acceptedMediaTypes={runtimeState.acceptedMediaTypes}
          chatModel={runtimeState.chatModel}
          isReviewAvailable={runtimeState.isReviewAvailable}
          nodeVersion={runtimeState.nodeVersion}
          setupMessage={runtimeState.setupMessage}
        />
      </div>
    </main>
  );
}
