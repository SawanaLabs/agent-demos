"use client";

import { StopIcon, WrenchIcon } from "@phosphor-icons/react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { McpAgentRuntimeState } from "@/lib/mcp-agent/server/runtime";
import { McpAgentAssistantTrace } from "./mcp-agent-assistant-trace";
import { getTextContent, mcpAgentSamplePrompts } from "./mcp-agent-model";
import { McpRuntimeSidebar } from "./mcp-runtime-sidebar";
import { useMcpAgentChat } from "./use-mcp-agent-chat";

interface McpAgentWorkspaceProps {
  chatModel: string;
  configuredServers: McpAgentRuntimeState["configuredServers"];
  configuredTools: McpAgentRuntimeState["configuredTools"];
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
}

export function McpAgentWorkspace({
  chatModel,
  configuredServers,
  configuredTools,
  isChatAvailable,
  nodeVersion,
  setupMessage,
}: McpAgentWorkspaceProps) {
  const {
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    status,
    stop,
  } = useMcpAgentChat();

  return (
    <div className="grid min-h-[70svh] gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[minmax(0,1fr)]">
      <section className="flex min-h-[70svh] flex-col border border-foreground/10 bg-background lg:h-full lg:min-h-0">
        {isChatAvailable ? null : (
          <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
            {setupMessage}
          </div>
        )}

        {error ? (
          <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
            {error.message}
          </div>
        ) : null}

        <Conversation className="min-h-0">
          <ConversationContent className="mx-auto flex w-full max-w-4xl flex-1 gap-6 px-4 pt-6 pb-[3lh]">
            {hasMessages ? (
              messages.map((message, index) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent
                    className={cn(
                      "space-y-4",
                      message.role === "assistant" ? "max-w-4xl" : "max-w-2xl"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <McpAgentAssistantTrace
                        isLastMessage={index === messages.length - 1}
                        isStreaming={isBusy}
                        message={message}
                      />
                    ) : (
                      <MessageResponse>
                        {getTextContent(message)}
                      </MessageResponse>
                    )}
                  </MessageContent>
                </Message>
              ))
            ) : (
              <ConversationEmptyState
                description="Ask about project docs, demo planning, or the local Next.js runtime. The agent will choose the relevant MCP tools without a mode switch."
                icon={<WrenchIcon className="size-5" />}
                title="MCP tool workspace is ready"
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-4xl">
            <PromptInput onSubmit={({ text }) => sendMessage({ text })}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={!isChatAvailable || isBusy}
                  placeholder="Ask about project docs, demos, or local Next.js runtime state."
                />
              </PromptInputBody>
              <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">ToolLoopAgent</Badge>
                  <Badge variant="outline">MCP</Badge>
                  <Badge variant="outline">{chatModel}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {isBusy ? (
                    <Button
                      onClick={stop}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <StopIcon className="size-3.5" />
                      Stop
                    </Button>
                  ) : null}
                  {hasMessages ? (
                    <Button
                      onClick={() => regenerate()}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Retry
                    </Button>
                  ) : null}
                  <PromptInputSubmit
                    disabled={!isChatAvailable}
                    status={status}
                  />
                </div>
              </PromptInputFooter>
            </PromptInput>

            {hasMessages ? null : (
              <div className="mt-3 flex flex-wrap gap-2">
                {mcpAgentSamplePrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    onClick={() => sendMessage({ text: prompt })}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <WrenchIcon className="size-3.5" />
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <McpRuntimeSidebar
        configuredServers={configuredServers}
        configuredTools={configuredTools}
        nodeVersion={nodeVersion}
      />
    </div>
  );
}
