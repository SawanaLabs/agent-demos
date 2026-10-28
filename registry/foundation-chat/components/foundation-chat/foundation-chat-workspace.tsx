"use client";

import {
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
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { BotIcon, RefreshCwIcon, SquareIcon } from "lucide-react";
import { DemoConversation } from "@/components/demo-conversation";
import { PageText, usePageCopy } from "@/components/page-copy";

import {
  ConversationErrorMessage,
  useConversationErrorRetry,
} from "@/components/demo-chat/conversation-error-message";

import { useFoundationChat } from "./use-foundation-chat";

const foundationChatSamplePrompts = [
  "Explain the minimum files this Foundation Chat demo needs in a fresh Next.js app.",
  "Show how the AI Gateway key flows from env vars into the chat route.",
  "Suggest the next demo slice to build after this baseline chat is working.",
] as const;

function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
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
  const pageCopy = usePageCopy();

  const {
    clearError,
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    status,
    stop,
  } = useFoundationChat();
  const retryConversationError = useConversationErrorRetry({
    clearError,
    regenerate,
  });

  return (
    <div className="grid min-h-[70svh] gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <Card className="min-h-[70svh] gap-0 bg-background py-0 text-base text-foreground leading-normal lg:h-full lg:min-h-0">
        {isChatAvailable ? null : (
          <>
            <div className="px-4 py-3 text-muted-foreground text-xs/relaxed">
              {setupMessage}
            </div>
            <Separator />
          </>
        )}

        <DemoConversation className="min-h-0">
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages || error ? (
              <>
                {messages.map((message) => {
                  const text = getTextContent(message);

                  return (
                    <Message from={message.role} key={message.id}>
                      <MessageContent
                        className={cn(
                          message.role === "assistant"
                            ? "max-w-3xl"
                            : "max-w-2xl"
                        )}
                      >
                        {text ? (
                          <MessageResponse>{text}</MessageResponse>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            <PageText>{"Waiting for visible output."}</PageText>
                          </p>
                        )}
                      </MessageContent>
                    </Message>
                  );
                })}
                {error ? (
                  <ConversationErrorMessage
                    error={error}
                    isRetryDisabled={isBusy || !isChatAvailable}
                    onRetry={retryConversationError}
                  />
                ) : null}
              </>
            ) : (
              <ConversationEmptyState
                description={pageCopy(
                  "Ask about the project, the stack, or any capability you want to turn into the next demo."
                )}
                icon={<BotIcon className="size-5" />}
                title={pageCopy("Foundation workspace is ready")}
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </DemoConversation>

        <Separator />
        <div className="px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput onSubmit={({ text }) => sendMessage({ text })}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={!isChatAvailable || isBusy}
                  placeholder={pageCopy(
                    "Ask this demo to explain the stack or help shape the next agent."
                  )}
                />
              </PromptInputBody>
              <Separator className="mt-3" />
              <PromptInputFooter className="flex items-center justify-between gap-3 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    <PageText>{"AI SDK 6"}</PageText>
                  </Badge>
                  <Badge variant="outline">
                    <PageText>{"Gateway"}</PageText>
                  </Badge>
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
                      <PageText>{"Stop"}</PageText>
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
                      <PageText>{"Retry"}</PageText>
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
                {foundationChatSamplePrompts.map((prompt) => (
                  <Button
                    className="h-auto max-w-full whitespace-normal text-left"
                    disabled={!isChatAvailable || isBusy}
                    key={prompt}
                    onClick={() => sendMessage({ text: prompt })}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <BotIcon className="size-3.5" />
                    <PageText>{prompt}</PageText>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="bg-background p-4 text-base text-foreground leading-normal lg:min-h-0 lg:overflow-y-auto">
        <div className="space-y-4">
          <div>
            <p className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
              <PageText>{"Runtime"}</PageText>
            </p>
            <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
          </div>
          <div>
            <p className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
              <PageText>{"Contract"}</PageText>
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              <PageText>
                {
                  "This slot proves the minimum copy-paste baseline: Next.js route, AI Gateway provider wiring, AI Elements workspace, and explicit setup errors."
                }
              </PageText>
            </p>
          </div>
          <div>
            <p className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
              <PageText>{"Demo role"}</PageText>
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              <PageText>
                {
                  "Future demos can duplicate this slice and replace only feature logic, route path, metadata, and model behavior."
                }
              </PageText>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
