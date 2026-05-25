"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { BotIcon, RefreshCwIcon, SquareIcon } from "lucide-react";
import { useState } from "react";
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

function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function useFoundationChat() {
  const [chat] = useState(
    () =>
      new Chat<UIMessage>({
        transport: new DefaultChatTransport({
          api: "/api/demos/foundation-chat",
        }),
      })
  );
  const controller = useChat({ chat });
  const hasMessages = controller.messages.length > 0;
  const isBusy =
    controller.status === "submitted" || controller.status === "streaming";

  return {
    ...controller,
    hasMessages,
    isBusy,
  };
}

export interface FoundationChatWorkspaceProps {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
}

export function FoundationChatWorkspace({
  chatModel,
  isChatAvailable,
  nodeVersion,
  setupMessage,
}: FoundationChatWorkspaceProps) {
  const {
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    status,
    stop,
  } = useFoundationChat();

  return (
    <div className="grid min-h-[70svh] gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="flex min-h-[70svh] flex-col border border-foreground/10 bg-background">
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

        <Conversation>
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages ? (
              messages.map((message) => {
                const text = getTextContent(message);

                return (
                  <Message from={message.role} key={message.id}>
                    <MessageContent
                      className={cn(
                        message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
                      )}
                    >
                      {text ? (
                        <MessageResponse>{text}</MessageResponse>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          Waiting for visible output.
                        </p>
                      )}
                    </MessageContent>
                  </Message>
                );
              })
            ) : (
              <ConversationEmptyState
                description="Ask about the stack, implementation tradeoffs, or the next agent capability to build."
                icon={<BotIcon className="size-5" />}
                title="Foundation workspace is ready"
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput onSubmit={({ text }) => sendMessage({ text })}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={!isChatAvailable || isBusy}
                  placeholder="Ask this demo to explain the stack or shape the next agent."
                />
              </PromptInputBody>
              <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">AI SDK 6</Badge>
                  <Badge variant="outline">AI Gateway</Badge>
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
                      <SquareIcon className="size-3.5" />
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
                      <RefreshCwIcon className="size-3.5" />
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
          </div>
        </div>
      </section>

      <aside className="border border-foreground/10 bg-background p-4">
        <div className="space-y-4">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Runtime
            </p>
            <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Contract
            </p>
            <p className="mt-1 text-sm">
              Next.js route, AI Gateway provider wiring, AI Elements workspace,
              and explicit setup errors.
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Install target
            </p>
            <p className="mt-1 text-sm">
              A clean shadcn/ui App Router project with AI SDK dependencies
              installed by the registry item.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
