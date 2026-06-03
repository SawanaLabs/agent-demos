"use client";

import type { useChat } from "@ai-sdk/react";
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
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";

import { SandboxAgentAssistantTrace } from "./sandbox-agent-assistant-trace";
import { getTextContent } from "./sandbox-agent-model";

interface SandboxConversationPaneProps {
  chatModel: string;
  hasMessages: boolean;
  isBusy: boolean;
  isChatAvailable: boolean;
  messages: UIMessage[];
  onOpenPreview: () => void;
  onRegenerate: () => void;
  onSendMessage: (text: string) => void;
  onStop: () => void;
  samplePrompts: readonly string[];
  sandboxProvider: string;
  status: ReturnType<typeof useChat>["status"];
}

export function SandboxConversationPane({
  chatModel,
  hasMessages,
  isBusy,
  isChatAvailable,
  messages,
  onOpenPreview,
  onRegenerate,
  onSendMessage,
  onStop,
  samplePrompts,
  sandboxProvider,
  status,
}: SandboxConversationPaneProps) {
  return (
    <TabsContent className="mt-0 min-h-0 flex-1" value="conversation">
      <div className="flex h-full min-h-0 flex-col">
        <Conversation className="min-h-0">
          <ConversationContent className="mx-auto flex w-full max-w-4xl flex-1 gap-6 px-4 py-6">
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
                      <SandboxAgentAssistantTrace
                        isLastMessage={index === messages.length - 1}
                        isStreaming={isBusy}
                        message={message}
                        onOpenPreview={onOpenPreview}
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
                description="Ask the agent to scaffold a static frontend prototype, edit files in the sandbox workspace, and expose a live preview."
                icon={<WrenchIcon className="size-5" />}
                title="Prototype workspace is ready"
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-4xl">
            <PromptInput onSubmit={({ text }) => onSendMessage(text)}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={!isChatAvailable || isBusy}
                  placeholder="Describe a frontend prototype you want to build in the sandbox."
                />
              </PromptInputBody>
              <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">ToolLoopAgent</Badge>
                  <Badge variant="outline">{sandboxProvider}</Badge>
                  <Badge variant="outline">{chatModel}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {isBusy ? (
                    <Button
                      onClick={onStop}
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
                      onClick={onRegenerate}
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
                {samplePrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    onClick={() => onSendMessage(prompt)}
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
      </div>
    </TabsContent>
  );
}
