"use client";

import { useChat } from "@ai-sdk/react";
import {
  ArrowClockwiseIcon,
  CaretDownIcon,
  RobotIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "@phosphor-icons/react";
import { Attachments } from "@workspace/ui/components/ai-elements/attachments";
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
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@workspace/ui/components/ai-elements/model-selector";
import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@workspace/ui/components/ai-elements/tool";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { Textarea } from "@workspace/ui/components/textarea";
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
import type {
  UltraChatbotAgentChatRecord,
  UltraChatbotAgentChatSession,
  UltraChatbotAgentHistoryPage,
  UltraChatbotAgentVoteRecord,
} from "../server/chat-store";
import type { UltraChatbotAgentModel } from "../server/models";
import { shouldShowUltraChatbotAgentResumeThinking } from "./resume-pending-state";
import { UltraChatbotAgentArtifact } from "./ultra-chatbot-agent-artifact";
import { UltraChatbotAgentDocumentPreview } from "./ultra-chatbot-agent-document-preview";
import { UltraChatbotAgentHistorySidebar } from "./ultra-chatbot-agent-history-sidebar";
import { UltraChatbotAgentMessageReasoning } from "./ultra-chatbot-agent-message-reasoning";
import {
  getUltraChatbotAgentFileParts,
  getUltraChatbotAgentReasoningText,
  getUltraChatbotAgentSourceParts,
  getUltraChatbotAgentToolParts,
  hasUltraChatbotAgentVisibleMessageContent,
  isUltraChatbotAgentDocumentResult,
} from "./ultra-chatbot-agent-message-parts";
import { UltraChatbotAgentMultimodalInput } from "./ultra-chatbot-agent-multimodal-input";
import { UltraChatbotAgentPreviewAttachment } from "./ultra-chatbot-agent-preview-attachment";
import { UltraChatbotAgentSources } from "./ultra-chatbot-agent-sources";
import { UltraChatbotAgentSuggestedActions } from "./ultra-chatbot-agent-suggested-actions";
import { UltraChatbotAgentVisibilitySelector } from "./ultra-chatbot-agent-visibility-selector";
import { UltraChatbotAgentWeather } from "./ultra-chatbot-agent-weather";
import { useUltraChatbotAgentArtifact } from "./use-ultra-chatbot-agent-artifact";

function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function isUltraChatbotAgentWeatherResult(
  output: ReturnType<typeof getUltraChatbotAgentToolParts>[number]["output"]
): output is Parameters<typeof UltraChatbotAgentWeather>[0]["weather"] {
  if (!output || typeof output !== "object") {
    return false;
  }

  return (
    "current" in output &&
    typeof output.current === "object" &&
    output.current !== null &&
    "daily" in output &&
    typeof output.daily === "object" &&
    output.daily !== null &&
    "current_units" in output &&
    typeof output.current_units === "object" &&
    output.current_units !== null
  );
}

function buildHistoryTitleFromMessages(messages: UIMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const text = firstUserMessage ? getTextContent(firstUserMessage).trim() : "";

  return text.slice(0, 72) || "New chat";
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

async function loadUltraChatbotAgentVotes(chatId: string) {
  const searchParams = new URLSearchParams({
    chatId,
  });
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/vote?${searchParams.toString()}`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load message votes.");
  }

  return (await response.json()) as UltraChatbotAgentVoteRecord[];
}

async function saveUltraChatbotAgentVote(input: {
  chatId: string;
  messageId: string;
  type: "clear" | "down" | "up";
}) {
  const response = await fetch("/api/demos/ultra-chatbot-agent/vote", {
    body: JSON.stringify(input),
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Failed to save the message vote.");
  }
}

async function trimUltraChatbotAgentMessagesAfterEdit(input: {
  chatId: string;
  messageId: string;
  text: string;
}) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/${input.chatId}/messages`,
    {
      body: JSON.stringify({
        messageId: input.messageId,
        text: input.text,
      }),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to prepare the edited turn.");
  }
}

function toConversationPath(chatId: string) {
  return `/demos/ultra-chatbot-agent/${chatId}`;
}

const nodeVersionPrefixPattern = /^v/;
const resumeRecoveryAttemptLimit = 6;

async function loadUltraChatbotAgentSessionSnapshot(chatId: string) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/${chatId}/session`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as UltraChatbotAgentChatSession;
}

function shouldApplyRecoveredSession(
  session: UltraChatbotAgentChatSession,
  messagesLength: number
) {
  return (
    session.messages.length > messagesLength ||
    session.messages.at(-1)?.role !== "user"
  );
}

interface UltraChatbotAgentWorkspaceProps {
  defaultChatModel: string;
  draftChatId: string;
  initialHistoryPage: UltraChatbotAgentHistoryPage;
  initialSession: UltraChatbotAgentChatSession | null;
  isChatAvailable: boolean;
  models: UltraChatbotAgentModel[];
  nodeVersion: string;
  setupMessage: string | null;
}

function useResumeRecovery(input: {
  chatId: string;
  initialSession: UltraChatbotAgentChatSession | null;
  latestMessageRole: UIMessage["role"] | undefined;
  messagesLength: number;
  setChatMeta: Dispatch<
    SetStateAction<{
      createdAt: string | null;
      id: string;
      selectedChatModel: string;
      updatedAt: string | null;
      visibility: "private" | "public";
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

      loadUltraChatbotAgentSessionSnapshot(chatId).then((session) => {
        if (isCancelled) {
          return;
        }

        if (session && shouldApplyRecoveredSession(session, messagesLength)) {
          shouldRecoverMissedResumeRef.current = false;
          setMessages(session.messages);
          setChatMeta({
            createdAt: session.chat.createdAt,
            id: session.chat.id,
            selectedChatModel: session.chat.selectedChatModel,
            updatedAt: session.chat.updatedAt,
            visibility: session.chat.visibility,
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

function findModel(
  models: UltraChatbotAgentModel[],
  modelId: string
): UltraChatbotAgentModel | undefined {
  return models.find((model) => model.id === modelId);
}

export function UltraChatbotAgentWorkspace({
  defaultChatModel,
  draftChatId,
  initialHistoryPage,
  initialSession,
  isChatAvailable,
  models,
  nodeVersion,
  setupMessage,
}: UltraChatbotAgentWorkspaceProps) {
  const generatedChatIdRef = useRef(initialSession?.chat.id ?? draftChatId);
  const hasPromotedRouteRef = useRef(Boolean(initialSession));
  const chatId = generatedChatIdRef.current;
  const [chatMeta, setChatMeta] = useState(() => ({
    createdAt: initialSession?.chat.createdAt ?? null,
    id: chatId,
    selectedChatModel:
      initialSession?.chat.selectedChatModel ?? defaultChatModel,
    updatedAt: initialSession?.chat.updatedAt ?? null,
    visibility: initialSession?.chat.visibility ?? "private",
  }));
  const selectedChatModelRef = useRef(chatMeta.selectedChatModel);
  const selectedVisibilityRef = useRef(chatMeta.visibility);

  useEffect(() => {
    selectedChatModelRef.current = chatMeta.selectedChatModel;
    selectedVisibilityRef.current = chatMeta.visibility;
  }, [chatMeta.selectedChatModel, chatMeta.visibility]);

  const {
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
    transport: new DefaultChatTransport({
      api: "/api/demos/ultra-chatbot-agent",
      credentials: "include",
      prepareReconnectToStreamRequest: ({ id }) => ({
        api: `/api/demos/ultra-chatbot-agent/${id}/stream`,
        credentials: "include",
      }),
      prepareSendMessagesRequest: ({ id, messages: nextMessages }) => ({
        body: {
          id,
          message: nextMessages.at(-1),
          selectedChatModel: selectedChatModelRef.current,
          selectedVisibilityType: selectedVisibilityRef.current,
        },
      }),
    }),
  });
  const hasMessages = messages.length > 0;
  const isBusy = status === "submitted" || status === "streaming";
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [pendingVote, setPendingVote] = useState<{
    messageId: string;
    target: "down" | "up";
  } | null>(null);
  const {
    closeArtifact,
    mode: artifactMode,
    openArtifact,
    refreshArtifact,
    refreshToken: artifactRefreshToken,
    selectedDocumentId,
    setMode: setArtifactMode,
  } = useUltraChatbotAgentArtifact();
  const [editError, setEditError] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [votesByMessageId, setVotesByMessageId] = useState<
    Record<string, boolean>
  >({});
  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const documentArtifactSignatureRef = useRef<string | null>(null);
  const latestMessageRole = messages.at(-1)?.role;
  const showThinking =
    isBusy &&
    !(
      latestAssistant &&
      hasUltraChatbotAgentVisibleMessageContent(latestAssistant)
    );
  const showResumeThinking = shouldShowUltraChatbotAgentResumeThinking({
    initialSession,
    messages,
  });
  const submitStatus =
    showResumeThinking && status === "streaming" ? "submitted" : status;
  const selectedModel =
    findModel(models, chatMeta.selectedChatModel) ?? models.at(0);
  const currentChatRecordHint =
    messages.length > 0
      ? ({
          activeStreamId: null,
          createdAt: chatMeta.createdAt ?? new Date().toISOString(),
          id: chatMeta.id,
          selectedChatModel: chatMeta.selectedChatModel,
          title: buildHistoryTitleFromMessages(messages),
          updatedAt: chatMeta.updatedAt ?? new Date().toISOString(),
          visibility: chatMeta.visibility,
          visitorId: initialSession?.chat.visitorId ?? "visitor",
        } satisfies UltraChatbotAgentChatRecord)
      : null;

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

  useEffect(() => {
    if (messages.length < 2) {
      setVotesByMessageId({});
      return;
    }

    let isCancelled = false;

    loadUltraChatbotAgentVotes(chatMeta.id)
      .then((votes) => {
        if (isCancelled) {
          return;
        }

        setVotesByMessageId(
          Object.fromEntries(
            votes.map((vote) => [vote.messageId, vote.isUpvoted])
          )
        );
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        console.error("Failed to load ultra-chatbot-agent votes.", error);
      });

    return () => {
      isCancelled = true;
    };
  }, [chatMeta.id, messages.length]);

  useEffect(() => {
    const nextSignature = messages
      .flatMap((message) =>
        getUltraChatbotAgentToolParts(message).flatMap((part) =>
          part.state === "output-available" &&
          isUltraChatbotAgentDocumentResult(part.output)
            ? [part.output.id]
            : []
        )
      )
      .join("|");

    if (documentArtifactSignatureRef.current === null) {
      documentArtifactSignatureRef.current = nextSignature;
      return;
    }

    if (documentArtifactSignatureRef.current === nextSignature) {
      return;
    }

    documentArtifactSignatureRef.current = nextSignature;
    refreshArtifact();
  }, [messages, refreshArtifact]);

  useResumeRecovery({
    chatId,
    initialSession,
    latestMessageRole,
    messagesLength: messages.length,
    setChatMeta,
    setMessages,
    status,
  });

  async function handleSubmit(parts: UIMessage["parts"]) {
    if (parts.length === 0) {
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

    await sendMessage({
      parts,
      role: "user",
    });
  }

  async function handleVote(messageId: string, type: "down" | "up") {
    const currentVote = votesByMessageId[messageId];
    const nextType =
      (type === "up" && currentVote === true) ||
      (type === "down" && currentVote === false)
        ? "clear"
        : type;

    setPendingVote({
      messageId,
      target: type,
    });

    try {
      await saveUltraChatbotAgentVote({
        chatId: chatMeta.id,
        messageId,
        type: nextType,
      });
      setVotesByMessageId((current) => {
        if (nextType === "clear") {
          const { [messageId]: _removed, ...rest } = current;
          return rest;
        }

        return {
          ...current,
          [messageId]: nextType === "up",
        };
      });
    } catch (error) {
      console.error("Failed to save ultra-chatbot-agent vote.", error);
    } finally {
      setPendingVote(null);
    }
  }

  async function handleSaveEdit(message: UIMessage) {
    const nextText = editingText.trim();

    if (!nextText) {
      setEditError("Edited message text cannot be empty.");
      return;
    }

    setEditError(null);

    try {
      await trimUltraChatbotAgentMessagesAfterEdit({
        chatId: chatMeta.id,
        messageId: message.id,
        text: nextText,
      });

      setMessages((currentMessages) => {
        const messageIndex = currentMessages.findIndex(
          (currentMessage) => currentMessage.id === message.id
        );

        if (messageIndex === -1) {
          return currentMessages;
        }

        return [
          ...currentMessages.slice(0, messageIndex),
          {
            ...message,
            parts: [{ text: nextText, type: "text" as const }],
          },
        ];
      });

      setEditingMessageId(null);
      setEditingText("");
      await regenerate();
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Failed to prepare the edited turn."
      );
    }
  }

  function renderMessageBody(message: UIMessage, isLastMessage: boolean) {
    const text = getTextContent(message);
    const fileParts = getUltraChatbotAgentFileParts(message);
    const sourceParts = getUltraChatbotAgentSourceParts(message);
    const toolParts = getUltraChatbotAgentToolParts(message);

    if (text) {
      return (
        <div className="space-y-4">
          <MessageResponse>{text}</MessageResponse>
          {fileParts.length > 0 ? (
            <Attachments variant="list">
              {fileParts.map((part) => {
                const attachmentId = `${message.id}-${part.filename ?? "attachment"}-${part.url}`;

                return (
                  <UltraChatbotAgentPreviewAttachment
                    attachment={{
                      ...part,
                      id: attachmentId,
                    }}
                    key={attachmentId}
                  />
                );
              })}
            </Attachments>
          ) : null}
        </div>
      );
    }

    if (fileParts.length > 0) {
      return (
        <Attachments variant="list">
          {fileParts.map((part) => {
            const attachmentId = `${message.id}-${part.filename ?? "attachment"}-${part.url}`;

            return (
              <UltraChatbotAgentPreviewAttachment
                attachment={{
                  ...part,
                  id: attachmentId,
                }}
                key={attachmentId}
              />
            );
          })}
        </Attachments>
      );
    }

    if (
      message.role === "assistant" &&
      isLastMessage &&
      toolParts.length === 0 &&
      showThinking
    ) {
      return <Shimmer className="text-sm">Thinking...</Shimmer>;
    }

    if (toolParts.length > 0) {
      return null;
    }

    if (sourceParts.length > 0) {
      return null;
    }

    return (
      <p className="text-muted-foreground text-sm">
        Waiting for visible output.
      </p>
    );
  }

  return (
    <div className="grid min-h-[70svh] gap-4 lg:grid-cols-[18rem_minmax(0,1fr)_20rem]">
      <UltraChatbotAgentHistorySidebar
        currentChatId={chatMeta.id}
        currentChatRecordHint={currentChatRecordHint}
        initialHistoryPage={initialHistoryPage}
      />

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
        {editError ? (
          <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
            {editError}
          </div>
        ) : null}
        {composerError ? (
          <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
            {composerError}
          </div>
        ) : null}
        {visibilityError ? (
          <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
            {visibilityError}
          </div>
        ) : null}
        <div className="border-foreground/10 border-b px-4 py-3">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Conversation
              </p>
              <p className="mt-1 text-sm">
                Route-backed chat with visitor-owned state and resumable stream.
              </p>
            </div>
            <UltraChatbotAgentVisibilitySelector
              chatId={chatMeta.id}
              disabled={!(initialSession || hasMessages)}
              onChange={(visibility) =>
                {
                  selectedVisibilityRef.current = visibility;
                  setChatMeta((current) => ({
                    ...current,
                    visibility,
                  }));
                }
              }
              onError={setVisibilityError}
              value={chatMeta.visibility}
            />
          </div>
        </div>

        <Conversation>
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages ? (
              <>
                {messages.map((message) => {
                  const reasoningText =
                    message.role === "assistant"
                      ? getUltraChatbotAgentReasoningText(message)
                      : "";
                  const sources =
                    message.role === "assistant"
                      ? getUltraChatbotAgentSourceParts(message)
                      : [];
                  const lastPart = message.parts.at(-1);
                  const isLastMessage = messages.at(-1)?.id === message.id;
                  const isReasoningStreaming =
                    message.role === "assistant" &&
                    isLastMessage &&
                    status === "streaming" &&
                    lastPart?.type === "reasoning";

                  const currentVote = votesByMessageId[message.id];
                  const isVotePending = pendingVote?.messageId === message.id;
                  const isHelpfulPending =
                    isVotePending && pendingVote.target === "up";
                  const isNeedsWorkPending =
                    isVotePending && pendingVote.target === "down";
                  const showFeedbackButtons =
                    message.role === "assistant" &&
                    !(isLastMessage && status === "streaming") &&
                    !(isLastMessage && status === "submitted") &&
                    hasUltraChatbotAgentVisibleMessageContent(message);

                  return (
                    <Message from={message.role} key={message.id}>
                      <MessageContent
                        className={cn(
                          message.role === "assistant"
                            ? "max-w-3xl"
                            : "max-w-2xl"
                        )}
                      >
                        {getUltraChatbotAgentToolParts(message).map((part) => {
                          const documentResult =
                            part.state === "output-available" &&
                            isUltraChatbotAgentDocumentResult(part.output)
                              ? part.output
                              : null;
                          const weatherResult =
                            part.state === "output-available" &&
                            isUltraChatbotAgentWeatherResult(part.output)
                              ? part.output
                              : null;
                          const isDocumentTool =
                            part.type === "tool-createDocument" ||
                            part.type === "tool-editDocument" ||
                            part.type === "tool-updateDocument";

                          if (
                            isDocumentTool &&
                            part.state === "output-available" &&
                            part.output &&
                            typeof part.output === "object" &&
                            "error" in part.output
                          ) {
                            return (
                              <div
                                className="w-full rounded-xl border border-destructive/30 px-4 py-3 text-destructive text-sm"
                                key={part.toolCallId}
                              >
                                {String(part.output.error)}
                              </div>
                            );
                          }

                          if (documentResult && isDocumentTool) {
                            return (
                              <UltraChatbotAgentDocumentPreview
                                chatId={chatMeta.id}
                                key={part.toolCallId}
                                onOpen={openArtifact}
                                result={documentResult}
                              />
                            );
                          }

                          return (
                            <Tool defaultOpen={false} key={part.toolCallId}>
                              {part.type === "dynamic-tool" ? (
                                <ToolHeader
                                  state={part.state}
                                  toolName={part.toolName}
                                  type={part.type}
                                />
                              ) : (
                                <ToolHeader
                                  state={part.state}
                                  type={part.type}
                                />
                              )}
                              <ToolContent>
                                {part.input ? (
                                  <ToolInput input={part.input} />
                                ) : null}
                                {weatherResult ? null : (
                                  <ToolOutput
                                    errorText={part.errorText}
                                    output={part.output}
                                  />
                                )}
                                {weatherResult ? (
                                  <UltraChatbotAgentWeather
                                    weather={weatherResult}
                                  />
                                ) : null}
                              </ToolContent>
                            </Tool>
                          );
                        })}
                        {reasoningText ? (
                          <UltraChatbotAgentMessageReasoning
                            isLoading={isReasoningStreaming}
                            reasoning={reasoningText}
                          />
                        ) : null}
                        <UltraChatbotAgentSources sources={sources} />
                        {editingMessageId === message.id ? (
                          <div className="space-y-3">
                            <Textarea
                              onChange={(event) =>
                                setEditingText(event.target.value)
                              }
                              value={editingText}
                            />
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                disabled={isBusy}
                                onClick={() => handleSaveEdit(message)}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Save and replay
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditingText("");
                                  setEditError(null);
                                }}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          renderMessageBody(message, isLastMessage)
                        )}
                        {showFeedbackButtons ? (
                          <div className="mt-3 flex items-center gap-2">
                            <Button
                              aria-label="Helpful"
                              disabled={isVotePending}
                              onClick={() => handleVote(message.id, "up")}
                              size="sm"
                              type="button"
                              title="Helpful"
                              variant={
                                currentVote === true
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {isHelpfulPending ? (
                                <Spinner className="size-3.5" />
                              ) : currentVote === true ? (
                                <ThumbsUpIcon className="size-3.5 text-emerald-500" />
                              ) : (
                                <ThumbsUpIcon className="size-3.5" />
                              )}
                              {currentVote === true && !isHelpfulPending ? (
                                <span>Helpful</span>
                              ) : null}
                            </Button>
                            <Button
                              aria-label="Needs work"
                              disabled={isVotePending}
                              onClick={() => handleVote(message.id, "down")}
                              size="sm"
                              type="button"
                              title="Needs work"
                              variant={
                                currentVote === false
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {isNeedsWorkPending ? (
                                <Spinner className="size-3.5" />
                              ) : currentVote === false ? (
                                <ThumbsDownIcon className="size-3.5 text-rose-500" />
                              ) : (
                                <ThumbsDownIcon className="size-3.5" />
                              )}
                              {currentVote === false && !isNeedsWorkPending ? (
                                <span>Needs work</span>
                              ) : null}
                            </Button>
                          </div>
                        ) : null}
                      </MessageContent>
                      {message.role === "user" && editingMessageId !== message.id ? (
                        <div className="mt-3 flex w-full justify-end">
                          <Button
                            disabled={isBusy}
                            onClick={() => {
                              setEditingMessageId(message.id);
                              setEditingText(getTextContent(message));
                              setEditError(null);
                            }}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Edit
                          </Button>
                        </div>
                      ) : null}
                    </Message>
                  );
                })}
                {showResumeThinking ? (
                  <Message from="assistant">
                    <MessageContent className="max-w-3xl">
                      <Shimmer className="text-sm">Thinking...</Shimmer>
                    </MessageContent>
                  </Message>
                ) : null}
              </>
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-6 py-12">
                <ConversationEmptyState
                  description="Start a conversation, switch models, then refresh the page to reload the same route-backed chat."
                  icon={<RobotIcon className="size-5" />}
                  title="Ultra route is ready"
                />
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <UltraChatbotAgentMultimodalInput
              disabled={!isChatAvailable || isBusy}
              footerBelow={
                hasMessages ? null : (
                  <UltraChatbotAgentSuggestedActions
                    onSelect={(value) =>
                      handleSubmit([{ text: value, type: "text" as const }])
                    }
                  />
                )
              }
              footerLeading={
                <>
                  <Badge variant="outline">Visitor scoped</Badge>
                  <Badge variant="outline">Postgres</Badge>
                  <Badge variant="outline">Blob uploads</Badge>
                  <ModelSelector
                    onOpenChange={setIsModelSelectorOpen}
                    open={isModelSelectorOpen}
                  >
                    <ModelSelectorTrigger className="inline-flex h-7 items-center gap-2 border border-input px-2 text-xs">
                      <ModelSelectorLogo
                        provider={selectedModel?.provider ?? "openai"}
                      />
                      <span>
                        {selectedModel?.name ?? chatMeta.selectedChatModel}
                      </span>
                      <CaretDownIcon className="size-3" />
                    </ModelSelectorTrigger>
                    <ModelSelectorContent
                      className="sm:max-w-md"
                      title="Select model"
                    >
                      <ModelSelectorInput placeholder="Search models..." />
                      <ModelSelectorList>
                        <ModelSelectorEmpty>
                          No models found.
                        </ModelSelectorEmpty>
                        <ModelSelectorGroup heading="Available models">
                          {models.map((model) => (
                            <ModelSelectorItem
                              key={model.id}
                              onSelect={() => {
                                selectedChatModelRef.current = model.id;
                                setChatMeta((current) => ({
                                  ...current,
                                  selectedChatModel: model.id,
                                }));
                                setIsModelSelectorOpen(false);
                              }}
                              value={`${model.name} ${model.id}`}
                            >
                              <ModelSelectorLogo provider={model.provider} />
                              <ModelSelectorName>
                                {model.name}
                              </ModelSelectorName>
                              <span className="text-muted-foreground text-xs">
                                {model.capabilities.reasoning
                                  ? "Reasoning"
                                  : "Chat"}
                              </span>
                            </ModelSelectorItem>
                          ))}
                        </ModelSelectorGroup>
                      </ModelSelectorList>
                    </ModelSelectorContent>
                  </ModelSelector>
                </>
              }
              onComposerErrorChange={setComposerError}
              onSend={handleSubmit}
              onStop={stop}
              placeholder="Ask for a draft, compare models, and attach a PNG or JPEG before sending."
              status={submitStatus}
            />
          </div>
        </div>
      </section>

      <aside className="border border-foreground/10 bg-background p-4">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Session
              </p>
              <p className="mt-1 font-medium text-sm">
                {initialSession ? "Restored route" : "New route promotion"}
              </p>
            </div>
            <Link
              className="inline-flex h-8 items-center justify-center border border-foreground/10 px-3 text-sm transition-colors hover:border-foreground/30"
              href="/demos/ultra-chatbot-agent"
            >
              New chat
            </Link>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Chat ID
            </p>
            <p className="mt-1 break-all font-mono text-xs">{chatMeta.id}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Created
              </p>
              <p className="mt-1 text-sm">
                {formatDateTime(chatMeta.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Updated
              </p>
              <p className="mt-1 text-sm">
                {formatDateTime(chatMeta.updatedAt)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Current model
            </p>
            <p className="mt-1 text-sm">{selectedModel?.name}</p>
            <p className="mt-1 text-muted-foreground text-xs/relaxed">
              {selectedModel?.description}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Port contract
            </p>
            <p className="mt-1 text-sm">
              This slice keeps the route identity, visitor isolation, resumable
              streaming, model selection, and the first document companion
              surface.
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Runtime
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">
                Node {nodeVersion.replace(nodeVersionPrefixPattern, "")}
              </Badge>
              <Badge variant="outline">HTTP-only cookie</Badge>
              <Badge variant="outline">Redis resume</Badge>
            </div>
          </div>

          <UltraChatbotAgentArtifact
            chatId={chatMeta.id}
            disabled={!isChatAvailable || isBusy}
            mode={artifactMode}
            onClose={closeArtifact}
            onModeChange={setArtifactMode}
            onOpen={openArtifact}
            onRefresh={refreshArtifact}
            refreshToken={artifactRefreshToken}
            selectedDocumentId={selectedDocumentId}
          />

          {initialSession?.chat.activeStreamId ? (
            <Button
              onClick={() => resumeStream()}
              size="sm"
              type="button"
              variant="outline"
            >
              <ArrowClockwiseIcon className="size-3.5" />
              Retry resume
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
