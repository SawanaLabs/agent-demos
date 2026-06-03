"use client";

import { useChat } from "@ai-sdk/react";
import {
  ArrowClockwiseIcon,
  CaretDownIcon,
  CheckCircleIcon,
  RobotIcon,
} from "@phosphor-icons/react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@workspace/ui/components/ai-elements/conversation";
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
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from "ai";
import Link from "next/link";
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ConversationErrorMessage,
  useConversationErrorRetry,
} from "@/features/shared/chat/ui/conversation-error-message";
import { ultraChatbotAgentKnowledgeSource } from "../knowledge-source";
import type { UltraChatbotAgentCapabilities } from "../server/capabilities";
import type {
  UltraChatbotAgentChatRecord,
  UltraChatbotAgentChatSession,
  UltraChatbotAgentHistoryPage,
  UltraChatbotAgentVoteRecord,
} from "../server/chat-store";
import type { UltraChatbotAgentModel } from "../server/models";
import { shouldShowUltraChatbotAgentResumeThinking } from "./resume-pending-state";
import { UltraChatbotAgentArtifact } from "./ultra-chatbot-agent-artifact";
import { UltraChatbotAgentHistorySidebar } from "./ultra-chatbot-agent-history-sidebar";
import {
  getUltraChatbotAgentTextContent,
  getUltraChatbotAgentToolParts,
  hasUltraChatbotAgentVisibleMessageContent,
  isUltraChatbotAgentDocumentResult,
} from "./ultra-chatbot-agent-message-parts";
import { UltraChatbotAgentMessages } from "./ultra-chatbot-agent-messages";
import { UltraChatbotAgentMultimodalInput } from "./ultra-chatbot-agent-multimodal-input";
import { applyUltraChatbotAgentSandboxApproval } from "./ultra-chatbot-agent-sandbox-approval";
import { UltraChatbotAgentSuggestedActions } from "./ultra-chatbot-agent-suggested-actions";
import { UltraChatbotAgentVisibilitySelector } from "./ultra-chatbot-agent-visibility-selector";
import { useUltraChatbotAgentArtifact } from "./use-ultra-chatbot-agent-artifact";

function buildHistoryTitleFromMessages(messages: UIMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const text = firstUserMessage
    ? getUltraChatbotAgentTextContent(firstUserMessage).trim()
    : "";

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

async function saveUltraChatbotAgentCapabilities(input: {
  chatId: string;
  sandboxEnabled: boolean;
}) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/${input.chatId}/capabilities`,
    {
      body: JSON.stringify({
        sandboxEnabled: input.sandboxEnabled,
      }),
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update sandbox capability.");
  }

  return (await response.json()) as UltraChatbotAgentCapabilities;
}

async function trimUltraChatbotAgentMessagesAfterEdit(input: {
  chatId: string;
  messageId: string;
  retainedFileUrls?: string[];
  text: string;
}) {
  const response = await fetch(
    `/api/demos/ultra-chatbot-agent/${input.chatId}/messages`,
    {
      body: JSON.stringify({
        messageId: input.messageId,
        retainedFileUrls: input.retainedFileUrls,
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
      capabilities: UltraChatbotAgentCapabilities;
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
            capabilities: session.chat.capabilities,
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: this port keeps the vercel/chatbot-style chat surface in one workspace while QA hardens vertical slices.
// biome-ignore lint/complexity/noExcessiveLinesPerFunction: follow-up architecture work can split the shell after the current QA checklist is closed.
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
    capabilities: initialSession?.chat.capabilities ?? {
      sandboxEnabled: false,
    },
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
    addToolApprovalResponse,
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
    transport: new DefaultChatTransport({
      api: "/api/demos/ultra-chatbot-agent",
      credentials: "include",
      prepareReconnectToStreamRequest: ({ id }) => ({
        api: `/api/demos/ultra-chatbot-agent/${id}/stream`,
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
          selectedChatModel: selectedChatModelRef.current,
          selectedVisibilityType: selectedVisibilityRef.current,
          trigger,
        },
      }),
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const retryConversationError = useConversationErrorRetry({
    clearError,
    regenerate,
  });
  const hasMessages = messages.length > 0;
  const isBusy = status === "submitted" || status === "streaming";
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingRetainedFileUrls, setEditingRetainedFileUrls] = useState<
    string[]
  >([]);
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
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [isSandboxUpdating, setIsSandboxUpdating] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [votesByMessageId, setVotesByMessageId] = useState<
    Record<string, boolean>
  >({});
  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const documentArtifactSignatureRef = useRef("");
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
  const currentChatTitle = hasMessages
    ? buildHistoryTitleFromMessages(messages)
    : "New chat";
  const hasPersistedChatMeta =
    hasMessages && Boolean(chatMeta.createdAt) && Boolean(chatMeta.updatedAt);
  const currentChatRecordHint = useMemo(() => {
    const createdAt = chatMeta.createdAt;
    const updatedAt = chatMeta.updatedAt;

    if (!hasPersistedChatMeta) {
      return null;
    }

    if (!(createdAt && updatedAt)) {
      return null;
    }

    return {
      activeStreamId: null,
      capabilities: chatMeta.capabilities,
      createdAt,
      id: chatMeta.id,
      selectedChatModel: chatMeta.selectedChatModel,
      title: currentChatTitle,
      updatedAt,
      visibility: chatMeta.visibility,
      visitorId: initialSession?.chat.visitorId ?? "visitor",
    } satisfies UltraChatbotAgentChatRecord;
  }, [
    chatMeta.capabilities,
    chatMeta.createdAt,
    chatMeta.id,
    chatMeta.selectedChatModel,
    chatMeta.updatedAt,
    chatMeta.visibility,
    currentChatTitle,
    hasPersistedChatMeta,
    initialSession?.chat.visitorId,
  ]);
  let sandboxButtonContent: ReactNode = chatMeta.capabilities.sandboxEnabled
    ? "Lock sandbox"
    : "Enable sandbox";

  if (isSandboxUpdating) {
    sandboxButtonContent = <Spinner className="size-3.5" />;
  }

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

    if (documentArtifactSignatureRef.current === nextSignature) {
      return;
    }

    documentArtifactSignatureRef.current = nextSignature;
    if (nextSignature) {
      refreshArtifact();
    }
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

  async function persistSandboxCapability(sandboxEnabled: boolean) {
    const capabilities = await saveUltraChatbotAgentCapabilities({
      chatId: chatMeta.id,
      sandboxEnabled,
    });

    setChatMeta((current) => ({
      ...current,
      capabilities,
      updatedAt: new Date().toISOString(),
    }));
  }

  function getSandboxCapabilityErrorMessage(error: unknown) {
    return error instanceof Error
      ? error.message
      : "Failed to update sandbox capability.";
  }

  async function handleSandboxCapabilityChange(sandboxEnabled: boolean) {
    setSandboxError(null);
    setIsSandboxUpdating(true);

    try {
      await persistSandboxCapability(sandboxEnabled);
    } catch (error) {
      setSandboxError(getSandboxCapabilityErrorMessage(error));
    } finally {
      setIsSandboxUpdating(false);
    }
  }

  async function handleSandboxApprovalResponse(input: {
    approvalId: string;
    approved: boolean;
    reason: string;
  }) {
    setSandboxError(null);
    setIsSandboxUpdating(true);

    try {
      await applyUltraChatbotAgentSandboxApproval({
        ...input,
        addToolApprovalResponse,
        persistSandboxCapability,
      });
    } catch (error) {
      setSandboxError(getSandboxCapabilityErrorMessage(error));
    } finally {
      setIsSandboxUpdating(false);
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
        retainedFileUrls: editingRetainedFileUrls,
        text: nextText,
      });

      setMessages((currentMessages) => {
        const messageIndex = currentMessages.findIndex(
          (currentMessage) => currentMessage.id === message.id
        );

        if (messageIndex === -1) {
          return currentMessages;
        }

        const retainedFileUrlSet = new Set(editingRetainedFileUrls);

        return [
          ...currentMessages.slice(0, messageIndex),
          {
            ...message,
            parts: [
              ...message.parts.filter((part) => {
                if (part.type === "text") {
                  return false;
                }

                if (part.type === "file") {
                  return retainedFileUrlSet.has(part.url);
                }

                return true;
              }),
              { text: nextText, type: "text" as const },
            ],
          },
        ];
      });

      setEditingMessageId(null);
      setEditingRetainedFileUrls([]);
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

  return (
    <div className="grid min-h-[70svh] gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[18rem_minmax(0,1fr)_20rem]">
      <UltraChatbotAgentHistorySidebar
        currentChatId={chatMeta.id}
        currentChatRecordHint={currentChatRecordHint}
        initialHistoryPage={initialHistoryPage}
      />

      <section className="flex min-h-[70svh] flex-col border border-foreground/10 bg-background lg:h-full lg:min-h-0">
        {isChatAvailable ? null : (
          <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
            {setupMessage}
          </div>
        )}

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
              onChange={(visibility) => {
                selectedVisibilityRef.current = visibility;
                setChatMeta((current) => ({
                  ...current,
                  visibility,
                }));
              }}
              onError={setVisibilityError}
              value={chatMeta.visibility}
            />
          </div>
        </div>

        <Conversation className="min-h-0">
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages || error ? (
              <>
                {hasMessages ? (
                  <UltraChatbotAgentMessages
                    chatId={chatMeta.id}
                    editingMessageId={editingMessageId}
                    editingRetainedFileUrls={editingRetainedFileUrls}
                    editingText={editingText}
                    isBusy={isBusy}
                    isSandboxUpdating={isSandboxUpdating}
                    messages={messages}
                    onArtifactOpen={openArtifact}
                    onCancelEdit={() => {
                      setEditingMessageId(null);
                      setEditingRetainedFileUrls([]);
                      setEditingText("");
                      setEditError(null);
                    }}
                    onEditTextChange={setEditingText}
                    onRemoveEditingFile={(url) =>
                      setEditingRetainedFileUrls((current) =>
                        current.filter((currentUrl) => currentUrl !== url)
                      )
                    }
                    onSandboxApprovalResponse={handleSandboxApprovalResponse}
                    onSaveEdit={handleSaveEdit}
                    onStartEdit={({ messageId, retainedFileUrls, text }) => {
                      setEditingMessageId(messageId);
                      setEditingRetainedFileUrls(retainedFileUrls);
                      setEditingText(text);
                      setEditError(null);
                    }}
                    onVote={handleVote}
                    pendingVote={pendingVote}
                    showResumeThinking={showResumeThinking}
                    showThinking={showThinking}
                    status={status}
                    votesByMessageId={votesByMessageId}
                  />
                ) : null}
                {error ? (
                  <ConversationErrorMessage
                    error={error}
                    isRetryDisabled={isBusy}
                    onRetry={retryConversationError}
                  />
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
            {hasMessages ? null : (
              <div className="mb-4">
                <UltraChatbotAgentSuggestedActions
                  onSelect={(value) =>
                    handleSubmit([{ text: value, type: "text" as const }])
                  }
                />
              </div>
            )}
            <UltraChatbotAgentMultimodalInput
              chatId={chatMeta.id}
              disabled={!isChatAvailable || isBusy}
              footerLeading={
                <>
                  <Badge variant="outline">Visitor scoped</Badge>
                  <Badge variant="outline">Blob uploads</Badge>
                  <Badge variant="outline">Project Docs MCP</Badge>
                  <Badge variant="outline">Preindexed RAG</Badge>
                  <Badge variant="outline">
                    {chatMeta.capabilities.sandboxEnabled
                      ? "Sandbox enabled"
                      : "Sandbox locked"}
                  </Badge>
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
                              <span className="text-muted-foreground text-xs">
                                {model.expectedLatency} latency
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {model.costProfile} cost
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
              placeholder="Ask for a draft, compare models, inspect project docs, query the preindexed PDF, and attach a PDF, PNG, or JPEG before sending."
              status={submitStatus}
            />
          </div>
        </div>
      </section>

      <aside className="border border-foreground/10 bg-background p-4 lg:min-h-0 lg:overflow-y-auto">
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
              Capabilities
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                variant={
                  chatMeta.capabilities.sandboxEnabled ? "secondary" : "outline"
                }
              >
                {chatMeta.capabilities.sandboxEnabled
                  ? "Sandbox enabled"
                  : "Sandbox locked"}
              </Badge>
              <Badge variant="outline">Preindexed RAG</Badge>
              <Badge variant="outline">Project Docs MCP</Badge>
            </div>
          </div>

          <div className="border border-foreground/10 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                  Sandbox
                </p>
                <p className="mt-1 text-sm">
                  {chatMeta.capabilities.sandboxEnabled
                    ? "Enabled for this chat"
                    : "Approval required"}
                </p>
              </div>
              {chatMeta.capabilities.sandboxEnabled ? (
                <CheckCircleIcon className="mt-0.5 size-4 text-emerald-500" />
              ) : null}
            </div>
            <p className="mt-2 text-muted-foreground text-xs/relaxed">
              Sandbox unlocks repo-local reads, shell execution, and
              skill-backed tools for this route. HITL approvals and this switch
              share the same per-chat capability state.
            </p>
            {sandboxError ? (
              <p className="mt-2 text-destructive text-xs/relaxed">
                {sandboxError}
              </p>
            ) : null}
            <Button
              className="mt-3"
              disabled={isSandboxUpdating || !hasMessages}
              onClick={() =>
                handleSandboxCapabilityChange(
                  !chatMeta.capabilities.sandboxEnabled
                )
              }
              size="sm"
              type="button"
              variant="outline"
            >
              {sandboxButtonContent}
            </Button>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Knowledge source
            </p>
            <p className="mt-1 text-sm">
              {ultraChatbotAgentKnowledgeSource.title}
            </p>
            <p className="mt-1 text-muted-foreground text-xs/relaxed">
              {ultraChatbotAgentKnowledgeSource.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                className="inline-flex h-8 items-center justify-center border border-foreground/10 px-3 text-sm transition-colors hover:border-foreground/30"
                href={ultraChatbotAgentKnowledgeSource.documentUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open PDF
              </Link>
              <Link
                className="inline-flex h-8 items-center justify-center border border-foreground/10 px-3 text-sm transition-colors hover:border-foreground/30"
                href={ultraChatbotAgentKnowledgeSource.sourcePageUrl}
                rel="noreferrer"
                target="_blank"
              >
                Source page
              </Link>
            </div>
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
