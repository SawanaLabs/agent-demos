import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ArrowLeft } from "lucide-react";

import { getFoundationChatRuntimeState } from "@/lib/foundation-chat/runtime";
import { FoundationChatWorkspace } from "@/components/foundation-chat/foundation-chat-workspace";

export function FoundationChatScreen() {
  const runtimeState = getFoundationChatRuntimeState();

  return (
    <TooltipProvider>
      <main className="min-h-svh bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
          <Card className="grid gap-4 bg-background px-4 py-5 text-base text-foreground leading-normal md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-2">
              <Breadcrumb>
                <BreadcrumbList className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
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
                      Foundation Chat
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
                Production-ready AI Gateway chat shell for the rest of the demos
              </h1>
              <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
                This first slot validates the shared route pattern, environment
                contract, and AI Elements workspace before the cookbook batches
                start branching into larger agents.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{runtimeState.statusLabel}</Badge>
              <Badge variant="outline">{runtimeState.chatModel}</Badge>
            </div>
          </Card>

          <div className="lg:h-svh">
            <FoundationChatWorkspace
              chatModel={runtimeState.chatModel}
              isChatAvailable={runtimeState.isChatAvailable}
              nodeVersion={runtimeState.nodeVersion}
              setupMessage={runtimeState.setupMessage}
            />
          </div>
        </div>
      </main>
    </TooltipProvider>
  );
}
