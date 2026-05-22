"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { ArrowClockwiseIcon, BookOpenIcon, RobotIcon, StopIcon } from "@phosphor-icons/react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@workspace/ui/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@workspace/ui/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@workspace/ui/components/ai-elements/prompt-input";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@workspace/ui/components/ai-elements/sources";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@workspace/ui/components/ai-elements/tool";
import { Badge } from "@workspace/ui/components/badge";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import {
  DefaultChatTransport,
  isToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { RagToolSource } from "@/features/rag-chatbot/server/retrieval";
import type { ragChatbotSourceDocument } from "@/features/rag-chatbot/server/source-document";

import { getSourceItemKey } from "./source-item-key";

function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function getToolParts(message: UIMessage) {
  return message.parts.filter(isToolUIPart);
}

function readSourcesFromToolPart(part: ToolUIPart) {
  if (part.state !== "output-available" || !part.output) {
    return [];
  }

  if (typeof part.output !== "object" || !("sources" in part.output)) {
    return [];
  }

  const { sources } = part.output as { sources?: RagToolSource[] };

  return Array.isArray(sources) ? sources : [];
}

export interface RagChatbotWorkspaceProps {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  sourceDocument: typeof ragChatbotSourceDocument;
  setupMessage: string | null;
}

export function RagChatbotWorkspace({
  chatModel,
  isChatAvailable,
  nodeVersion,
  sourceDocument,
  setupMessage,
}: RagChatbotWorkspaceProps) {
  const [chat] = useState(
    () =>
      new Chat({
        transport: new DefaultChatTransport({
          api: "/api/demos/rag-chatbot",
        }),
      })
  );
  const { error, messages, regenerate, sendMessage, status, stop } = useChat({
    chat,
  });

  const hasMessages = messages.length > 0;
  const isBusy = status === "submitted" || status === "streaming";
  const samplePrompts = useMemo(
    () => [
      "What does the manual say about the NASA logotype?",
      "How should the seal and the logotype be used differently?",
      "Summarize the core visual system described in this manual.",
    ],
    []
  );

  return (
    <div className="grid min-h-[70svh] gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
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
                const toolParts = getToolParts(message);
                const sources = toolParts.flatMap((part) =>
                  part.type === "dynamic-tool" ? [] : readSourcesFromToolPart(part)
                );

                return (
                  <Message from={message.role} key={message.id}>
                    <MessageContent
                      className={cn(
                        "space-y-4",
                        message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
                      )}
                    >
                      {sources.length > 0 ? (
                        <Sources>
                          <SourcesTrigger count={sources.length} />
                          <SourcesContent>
                            {sources.map((source, index) => (
                              <Source
                                href={source.documentUrl}
                                key={getSourceItemKey(message.id, source, index)}
                                title={source.citationLabel}
                              >
                                <span className="font-medium">
                                  {source.citationLabel}
                                </span>
                                {source.sectionTitle ? (
                                  <span className="text-muted-foreground">
                                    {source.sectionTitle}
                                  </span>
                                ) : null}
                              </Source>
                            ))}
                          </SourcesContent>
                        </Sources>
                      ) : null}

                      {text ? (
                        <MessageResponse>{text}</MessageResponse>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          Waiting for visible output.
                        </p>
                      )}

                      {toolParts.map((part) => (
                        <Tool key={part.toolCallId}>
                          {part.type === "dynamic-tool" ? (
                            <ToolHeader
                              state={part.state}
                              title="Knowledge Base Retrieval"
                              toolName={part.toolName}
                              type={part.type}
                            />
                          ) : (
                            <ToolHeader
                              state={part.state}
                              title="Knowledge Base Retrieval"
                              type={part.type}
                            />
                          )}
                          <ToolContent>
                            {part.input ? <ToolInput input={part.input} /> : null}
                            <ToolOutput
                              errorText={part.errorText}
                              output={part.output}
                            />
                          </ToolContent>
                        </Tool>
                      ))}
                    </MessageContent>
                  </Message>
                );
              })
            ) : (
              <ConversationEmptyState
                description="Ask about the indexed design manual. Every grounded answer is expected to flow through retrieval."
                icon={<BookOpenIcon className="size-5" />}
                title="Document support workspace is ready"
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
                  placeholder="Ask what the manual says, and inspect the retrieval trace underneath the answer."
                />
              </PromptInputBody>
              <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">RAG</Badge>
                  <Badge variant="outline">pgvector</Badge>
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
                      <ArrowClockwiseIcon className="size-3.5" />
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

            {!hasMessages ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {samplePrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    onClick={() => sendMessage({ text: prompt })}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <RobotIcon className="size-3.5" />
                    {prompt}
                  </Button>
                ))}
              </div>
            ) : null}
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
              Source document
            </p>
            <p className="mt-1 font-medium text-sm">{sourceDocument.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {sourceDocument.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ size: "sm", variant: "outline" })}
                href={sourceDocument.documentUrl}
                target="_blank"
              >
                Open PDF
              </Link>
              <Link
                className={buttonVariants({ size: "sm", variant: "outline" })}
                href={sourceDocument.sourcePageUrl}
                target="_blank"
              >
                NASA page
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Contract
            </p>
            <p className="mt-1 text-sm">
              The assistant is expected to retrieve evidence first, answer only
              from indexed content, and surface the retrieval trace alongside
              the response.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
