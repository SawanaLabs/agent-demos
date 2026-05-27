"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SandboxConversationPane } from "./sandbox-conversation-pane";
import { SandboxPreviewPane } from "./sandbox-preview-pane";
import { SandboxRuntimeSidebar } from "./sandbox-runtime-sidebar";
import { useSandboxAgentWorkspaceViewModel } from "./use-sandbox-agent-workspace-view-model";

export interface SandboxAgentWorkspaceProps {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  previewPort: number;
  sandboxProvider: string;
  setupMessage: string | null;
}

export function SandboxAgentWorkspace({
  chatModel,
  isChatAvailable,
  nodeVersion,
  previewPort,
  sandboxProvider,
  setupMessage,
}: SandboxAgentWorkspaceProps) {
  const workspace = useSandboxAgentWorkspaceViewModel();

  return (
    <div className="grid min-h-[70svh] gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="flex min-h-[70svh] flex-col border border-foreground/10 bg-background">
        {isChatAvailable ? null : (
          <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
            {setupMessage}
          </div>
        )}

        {workspace.error ? (
          <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
            {workspace.error.message}
          </div>
        ) : null}

        {workspace.isTabsMounted ? (
          <Tabs
            className="flex min-h-0 flex-1 flex-col gap-0"
            onValueChange={(value) =>
              workspace.actions.onTabChange(value as "conversation" | "preview")
            }
            value={workspace.activeTab}
          >
            <div className="border-foreground/10 border-b px-4 py-2">
              <TabsList className="grid w-fit grid-cols-2">
                <TabsTrigger value="conversation">Conversation</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>

            <SandboxConversationPane
              chatModel={chatModel}
              hasMessages={workspace.hasMessages}
              isBusy={workspace.isBusy}
              isChatAvailable={isChatAvailable}
              messages={workspace.messages}
              onOpenPreview={workspace.actions.onOpenPreview}
              onRegenerate={workspace.actions.onRegenerate}
              onSendMessage={workspace.actions.onSendMessage}
              onStop={workspace.actions.onStop}
              samplePrompts={workspace.samplePrompts}
              status={workspace.status}
            />

            <SandboxPreviewPane
              latestPreview={workspace.latestPreview}
              previewState={workspace.previewState}
            />
          </Tabs>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-foreground/10 border-b px-4 py-2">
              <div className="h-8 w-48 bg-muted" />
            </div>
            <div className="min-h-0 flex-1" />
          </div>
        )}
      </section>

      <SandboxRuntimeSidebar
        nodeVersion={nodeVersion}
        previewPort={previewPort}
        sandboxProvider={sandboxProvider}
      />
    </div>
  );
}
