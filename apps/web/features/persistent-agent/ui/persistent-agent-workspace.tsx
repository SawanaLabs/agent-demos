"use client";

import { useChat } from "@ai-sdk/react";
import { ArrowClockwiseIcon, LinkIcon, RobotIcon } from "@phosphor-icons/react";
import {
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
import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { DemoConversation } from "@/components/demo-conversation";
import { PageText, usePageCopy } from "@/components/page-copy";
import {
  ConversationErrorMessage,
  useConversationErrorRetry,
} from "@/features/shared/chat/ui/conversation-error-message";
import type {
  PersistentAgentChatRecord,
  PersistentAgentChatSession,
} from "../server/chat-store";
import { shouldShowResumeThinking } from "./resume-pending-state";

function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function getLatestAssistantText(messages: UIMessage[]) {
  const assistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  return assistant ? getTextContent(assistant) : "";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

function toConversationPath(chatId: string) {
  return `/demos/persistent-agent/${chatId}`;
}

const nodeVersionPrefixPattern = /^v/;
const resumeRecoveryAttemptLimit = 6;
const persistentAgentSamplePrompts = [
  "Create a short deployment checklist and persist it under this conversation URL.",
  "Explain how route promotion and resume streams work in this persistent chat.",
  "Draft a follow-up plan, then make it easy to verify after refreshing the page.",
] as const;

async function loadPersistentAgentSessionSnapshot(chatId: string) {
  const response = await fetch(
    `/api/demos/persistent-agent/${chatId}/session`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PersistentAgentChatSession;
}

function shouldApplyRecoveredSession(
  session: PersistentAgentChatSession,
  messagesLength: number
) {
  return (
    session.messages.length > messagesLength ||
    session.messages.at(-1)?.role !== "user"
  );
}

interface PersistentAgentWorkspaceProps {
  chatModel: string;
  draftChatId: string;
  initialSession: PersistentAgentChatSession | null;
  isChatAvailable: boolean;
  nodeVersion: string;
  recentChats: PersistentAgentChatRecord[];
  setupMessage: string | null;
}

function useResumeRecovery(input: {
  chatId: string;
  initialSession: PersistentAgentChatSession | null;
  latestMessageRole: UIMessage["role"] | undefined;
  messagesLength: number;
  setChatMeta: Dispatch<
    SetStateAction<{
      createdAt: string | null;
      id: string;
      updatedAt: string | null;
    }>
  >;
  setMessages: (messages: UIMessage[]) => void;
  status: string;
}) {
  const {
    chatId,
    initialSession,
    latestMessageRole,
    messagesLength,
    setChatMeta,
    setMessages,
    status,
  } = input;
  const shouldRecoverMissedResumeRef = useRef(
    initialSession?.chat.activeStreamId != null ||
      initialSession?.messages.at(-1)?.role === "user"
  );
  const initialMessageCountRef = useRef(initialSession?.messages.length ?? 0);

  useEffect(() => {
    if (!shouldRecoverMissedResumeRef.current) {
      return;
    }

    if (status !== "ready") {
      return;
    }

    if (
      messagesLength > initialMessageCountRef.current ||
      latestMessageRole !== "user"
    ) {
      shouldRecoverMissedResumeRef.current = false;
      return;
    }

    let isCancelled = false;
    let timeoutId: number | undefined;
    let attempt = 0;

    const runRecoveryAttempt = () => {
      attempt += 1;

      loadPersistentAgentSessionSnapshot(chatId).then((session) => {
        if (isCancelled) {
          return;
        }

        if (session && shouldApplyRecoveredSession(session, messagesLength)) {
          shouldRecoverMissedResumeRef.current = false;
          setMessages(session.messages);
          setChatMeta({
            createdAt: session.chat.createdAt,
            id: session.chat.id,
            updatedAt: session.chat.updatedAt,
          });
          return;
        }

        if (attempt >= resumeRecoveryAttemptLimit) {
          shouldRecoverMissedResumeRef.current = false;
          return;
        }

        timeoutId = window.setTimeout(runRecoveryAttempt, 1500);
      });
    };

    timeoutId = window.setTimeout(runRecoveryAttempt, 2500);

    return () => {
      isCancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    chatId,
    latestMessageRole,
    messagesLength,
    setChatMeta,
    setMessages,
    status,
  ]);
}

function createPersistentAgentTransport() {
  return new DefaultChatTransport({
    api: "/api/demos/persistent-agent",
    credentials: "include",
    prepareReconnectToStreamRequest: ({ id }) => ({
      api: `/api/demos/persistent-agent/${id}/stream`,
      credentials: "include",
    }),
    prepareSendMessagesRequest: ({
      id,
      messageId,
      messages: nextMessages,
      trigger,
    }) => ({
      body: {
        id,
        message: nextMessages.at(-1),
        messageId,
        trigger,
      },
    }),
  });
}

function PersistentMessageBody({
  message,
  showThinking,
}: {
  message: UIMessage;
  showThinking: boolean;
}) {
  const pageCopy = usePageCopy();
  const text = getTextContent(message);

  if (text) {
    return <MessageResponse>{text}</MessageResponse>;
  }

  if (message.role === "assistant" && showThinking) {
    return <Shimmer className="text-sm">{pageCopy("Thinking...")}</Shimmer>;
  }

  return (
    <p className="text-muted-foreground text-sm">
      <PageText>{"Waiting for visible output."}</PageText>
    </p>
  );
}

export function PersistentAgentWorkspace({
  chatModel,
  draftChatId,
  initialSession,
  isChatAvailable,
  nodeVersion,
  recentChats,
  setupMessage,
}: PersistentAgentWorkspaceProps) {
  const pageCopy = usePageCopy();

  const generatedChatIdRef = useRef(initialSession?.chat.id ?? draftChatId);
  const hasPromotedRouteRef = useRef(Boolean(initialSession));
  const chatId = generatedChatIdRef.current;
  const [chatMeta, setChatMeta] = useState(() => ({
    createdAt: initialSession?.chat.createdAt ?? null,
    id: chatId,
    updatedAt: initialSession?.chat.updatedAt ?? null,
  }));
  const {
    clearError,
    error,
    messages,
    regenerate,
    resumeStream,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat({
    id: chatId,
    messages: initialSession?.messages ?? [],
    resume: initialSession?.chat.activeStreamId != null,
    transport: createPersistentAgentTransport(),
  });
  useEffect(
    () => () => {
      stop();
    },
    [stop]
  );
  const retryConversationError = useConversationErrorRetry({
    clearError,
    regenerate,
  });
  const hasMessages = messages.length > 0;
  const isBusy = status === "submitted" || status === "streaming";
  const latestMessageRole = messages.at(-1)?.role;
  const latestAssistantText = getLatestAssistantText(messages);
  const showThinking = isBusy && latestAssistantText.length === 0;
  const showResumeThinking = shouldShowResumeThinking({
    initialSession,
    messages,
  });
  const submitStatus =
    showResumeThinking && status === "streaming" ? "submitted" : status;

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    setChatMeta((current) => ({
      ...current,
      createdAt: current.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }, [messages.length]);

  useResumeRecovery({
    chatId,
    initialSession,
    latestMessageRole,
    messagesLength: messages.length,
    setChatMeta,
    setMessages,
    status,
  });

  async function handleSubmit(text: string) {
    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
      return;
    }

    if (!hasPromotedRouteRef.current) {
      hasPromotedRouteRef.current = true;
      window.history.replaceState({}, "", toConversationPath(chatId));
      setChatMeta((current) => ({
        ...current,
        createdAt: current.createdAt ?? new Date().toISOString(),
      }));
    }

    await sendMessage({ text: trimmedText });
  }

  return (
    <div className="grid min-h-[70svh] min-w-0 grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex min-h-[70svh] flex-col border border-foreground/10 bg-background lg:h-full lg:min-h-0">
        {isChatAvailable ? null : (
          <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
            {setupMessage}
          </div>
        )}

        <DemoConversation className="min-h-0">
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages || error ? (
              <>
                {messages.map((message) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent
                      className={cn(
                        message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
                      )}
                    >
                      <PersistentMessageBody
                        message={message}
                        showThinking={showThinking}
                      />
                    </MessageContent>
                  </Message>
                ))}
                {error ? (
                  <ConversationErrorMessage
                    error={error}
                    isRetryDisabled={isBusy}
                    onRetry={retryConversationError}
                  />
                ) : null}
                {showResumeThinking ? (
                  <Message from="assistant">
                    <MessageContent className="max-w-3xl">
                      <Shimmer className="text-sm">
                        {pageCopy("Thinking...")}
                      </Shimmer>
                    </MessageContent>
                  </Message>
                ) : null}
              </>
            ) : (
              <ConversationEmptyState
                description={pageCopy(
                  "Start a conversation, refresh the page, and the same chat will restore from Postgres under this URL."
                )}
                icon={<RobotIcon className="size-5" />}
                title={pageCopy("Persistent route is ready")}
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </DemoConversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput onSubmit={({ text }) => handleSubmit(text)}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={!isChatAvailable || isBusy}
                  placeholder={pageCopy(
                    "Ask a question, refresh mid-stream, then return to the same URL."
                  )}
                />
              </PromptInputBody>
              <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    <PageText>{"Visitor scoped"}</PageText>
                  </Badge>
                  <Badge variant="outline">
                    <PageText>{"Postgres"}</PageText>
                  </Badge>
                  <Badge variant="outline">{chatModel}</Badge>
                </div>
                <PromptInputSubmit
                  disabled={!isChatAvailable}
                  status={submitStatus}
                />
              </PromptInputFooter>
            </PromptInput>

            {hasMessages ? null : (
              <PersistentSamplePrompts onSend={handleSubmit} />
            )}
          </div>
        </div>
      </section>

      <aside className="border border-foreground/10 bg-background p-4 lg:min-h-0 lg:overflow-y-auto">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                <PageText>{"Session"}</PageText>
              </p>
              <p className="mt-1 font-medium text-sm">
                <PageText>
                  {initialSession ? "Restored route" : "New route promotion"}
                </PageText>
              </p>
            </div>
            <Link
              className="inline-flex h-8 items-center justify-center border border-foreground/10 px-3 text-sm transition-colors hover:border-foreground/30"
              href="/demos/persistent-agent"
            >
              <PageText>{"New chat"}</PageText>
            </Link>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              <PageText>{"Chat ID"}</PageText>
            </p>
            <p className="mt-1 break-all font-mono text-xs">{chatMeta.id}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                <PageText>{"Created"}</PageText>
              </p>
              <p className="mt-1 text-sm">
                {formatDateTime(chatMeta.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                <PageText>{"Updated"}</PageText>
              </p>
              <p className="mt-1 text-sm">
                {formatDateTime(chatMeta.updatedAt)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              <PageText>{"Route contract"}</PageText>
            </p>
            <p className="mt-1 text-sm">
              <PageText>
                {
                  "First send promotes this page into a stable URL. Refresh reloads messages from the database. Mid-stream refresh reconnects through the resume endpoint."
                }
              </PageText>
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              <PageText>{"Recent chats"}</PageText>
            </p>
            <div className="mt-2 grid gap-2">
              {recentChats.length > 0 ? (
                recentChats.slice(0, 6).map((chat) => (
                  <Link
                    className={cn(
                      "border px-3 py-2 text-left text-sm transition-colors",
                      chat.id === chatMeta.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground/10 hover:border-foreground/30"
                    )}
                    href={toConversationPath(chat.id)}
                    key={chat.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="line-clamp-2">{chat.title}</span>
                      <LinkIcon className="mt-0.5 size-3.5 shrink-0" />
                    </div>
                    <p
                      className={cn(
                        "mt-2 text-[11px]",
                        chat.id === chatMeta.id
                          ? "text-background/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatDateTime(chat.updatedAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  <PageText>
                    {"No persisted chats for this visitor yet."}
                  </PageText>
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              <PageText>{"Runtime"}</PageText>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">
                <PageText>{"Node "}</PageText>
                {nodeVersion.replace(nodeVersionPrefixPattern, "")}
              </Badge>
              <Badge variant="outline">
                <PageText>{"HTTP-only cookie"}</PageText>
              </Badge>
              <Badge variant="outline">
                <PageText>{"Redis resume"}</PageText>
              </Badge>
            </div>
          </div>

          {initialSession?.chat.activeStreamId ? (
            <Button
              onClick={() => resumeStream()}
              size="sm"
              type="button"
              variant="outline"
            >
              <ArrowClockwiseIcon className="size-3.5" />
              <PageText>{"Retry resume"}</PageText>
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function PersistentSamplePrompts({
  onSend,
}: {
  onSend: (text: string) => Promise<void>;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {persistentAgentSamplePrompts.map((prompt) => (
        <Button
          className="h-auto max-w-full whitespace-normal text-left"
          key={prompt}
          onClick={() => onSend(prompt)}
          size="sm"
          type="button"
          variant="outline"
        >
          <RobotIcon className="size-3.5" />
          <PageText>{prompt}</PageText>
        </Button>
      ))}
    </div>
  );
}
