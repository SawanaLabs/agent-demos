"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import {
  ArrowClockwiseIcon,
  PaperclipIcon,
  ShieldCheckIcon,
  StopIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { DeepPartial, FileUIPart } from "ai";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@workspace/ui/components/ai-elements/attachments";
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
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  ContentReviewAttachment,
  ContentReviewResult,
} from "../schema";
import { contentReviewResultSchema } from "../schema";
import { ContentReviewResultCard } from "./content-review-result-card";
import {
  buildPendingReviewAttachment,
  convertFilesToReviewAttachments,
  type PendingReviewAttachment,
  type SubmittedReviewAttachment,
} from "./convert-files-to-review-attachments";

type ReviewEntryStatus = "streaming" | "ready" | "error" | "stopped";

interface ReviewThreadEntry {
  attachments: SubmittedReviewAttachment[];
  errorMessage: string | null;
  id: string;
  prompt: string;
  requestAttachments: ContentReviewAttachment[];
  result: DeepPartial<ContentReviewResult> | undefined;
  status: ReviewEntryStatus;
}

export interface ContentReviewWorkspaceProps {
  acceptedMediaTypes: string[];
  chatModel: string;
  isReviewAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
}

function getUserAttachmentParts(attachments: SubmittedReviewAttachment[]) {
  return attachments.map(
    (attachment): FileUIPart => ({
      filename: attachment.filename,
      mediaType: attachment.mediaType,
      type: "file",
      url: attachment.previewUrl,
    })
  );
}

export function ContentReviewWorkspace({
  acceptedMediaTypes,
  chatModel,
  isReviewAvailable,
  nodeVersion,
  setupMessage,
}: ContentReviewWorkspaceProps) {
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingReviewAttachment[]
  >([]);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ReviewThreadEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAttachmentsRef = useRef<PendingReviewAttachment[]>([]);
  const entriesRef = useRef<ReviewThreadEntry[]>([]);
  const latestObjectRef = useRef<DeepPartial<ContentReviewResult> | undefined>(
    undefined
  );
  const activeEntryIdRef = useRef<string | null>(null);

  const {
    clear,
    error,
    isLoading,
    object,
    stop,
    submit,
  } = useObject<
    typeof contentReviewResultSchema,
    ContentReviewResult,
    {
      attachments: ContentReviewAttachment[];
      prompt: string;
    }
  >({
    api: "/api/demos/content-review",
    onError(streamError) {
      const entryId = activeEntryIdRef.current;

      if (!entryId) {
        return;
      }

      setEntries((current) =>
        current.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                errorMessage: streamError.message,
                result: latestObjectRef.current ?? entry.result,
                status: "error",
              }
            : entry
        )
      );
      setActiveEntryId(null);
    },
    onFinish({ error: finishError, object: finalObject }) {
      const entryId = activeEntryIdRef.current;

      if (!entryId) {
        return;
      }

      setEntries((current) =>
        current.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                errorMessage: finishError?.message ?? null,
                result:
                  finalObject ??
                  latestObjectRef.current ??
                  entry.result,
                status: finishError ? "error" : "ready",
              }
            : entry
        )
      );
      setActiveEntryId(null);
    },
    schema: contentReviewResultSchema,
  });

  const hasMessages = entries.length > 0;
  const samplePrompts = useMemo(
    () => [
      "Review this pricing page draft for risky claims and unsupported promises.",
      "Check this PDF policy one-pager and screenshot for anything a moderator should escalate.",
      "Read the attached assets and tell me whether the content is publishable as-is.",
    ],
    []
  );

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    activeEntryIdRef.current = activeEntryId;
  }, [activeEntryId]);

  useEffect(() => {
    latestObjectRef.current = object;
  }, [object]);

  useEffect(() => {
    return () => {
      const previewUrls = new Set<string>();

      for (const attachment of pendingAttachmentsRef.current) {
        previewUrls.add(attachment.previewUrl);
      }

      for (const entry of entriesRef.current) {
        for (const attachment of entry.attachments) {
          previewUrls.add(attachment.previewUrl);
        }
      }

      for (const url of previewUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  function removePendingAttachment(attachmentId: string) {
    setPendingAttachments((current) => {
      const target = current.find((attachment) => attachment.id === attachmentId);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((attachment) => attachment.id !== attachmentId);
    });
  }

  function appendFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const nextAttachments = Array.from(fileList).map(buildPendingReviewAttachment);
    setPendingAttachments((current) => {
      const byId = new Map(current.map((attachment) => [attachment.id, attachment]));

      for (const attachment of nextAttachments) {
        byId.set(attachment.id, attachment);
      }

      return Array.from(byId.values());
    });
  }

  async function handleSubmit(text: string) {
    const prompt = text.trim();

    if (!prompt && pendingAttachments.length === 0) {
      return;
    }

    try {
      setComposerError(null);
      const attachments = await convertFilesToReviewAttachments(
        pendingAttachments.map((attachment) => attachment.file)
      );
      const threadAttachments = pendingAttachments.map((attachment) => ({
        filename: attachment.file.name,
        id: attachment.id,
        mediaType: attachment.file.type || "application/octet-stream",
        previewUrl: attachment.previewUrl,
      }));
      const entryId = crypto.randomUUID();

      setEntries((current) => [
        ...current,
        {
          attachments: threadAttachments,
          errorMessage: null,
          id: entryId,
          prompt,
          requestAttachments: attachments,
          result: undefined,
          status: "streaming",
        },
      ]);
      setActiveEntryId(entryId);
      latestObjectRef.current = undefined;
      submit({
        attachments,
        prompt,
      });
      setPendingAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (attachmentError) {
      setComposerError(
        attachmentError instanceof Error
          ? attachmentError.message
          : "Failed to prepare review attachments."
      );
    }
  }

  function handleStop() {
    const entryId = activeEntryIdRef.current;

    stop();

    if (!entryId) {
      return;
    }

    setEntries((current) =>
      current.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              result: latestObjectRef.current ?? entry.result,
              status: "stopped",
            }
          : entry
      )
    );
    setActiveEntryId(null);
  }

  function handleRetry(entry: ReviewThreadEntry) {
    if (isLoading) {
      return;
    }

    clear();
    setEntries((current) =>
      current.map((currentEntry) =>
        currentEntry.id === entry.id
          ? {
              ...currentEntry,
              errorMessage: null,
              result: currentEntry.result,
              status: "streaming",
            }
          : currentEntry
      )
    );
    setActiveEntryId(entry.id);
    latestObjectRef.current = undefined;
    submit({
      attachments: entry.requestAttachments,
      prompt: entry.prompt,
    });
  }

  return (
    <div className="grid min-h-[70svh] gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex min-h-[70svh] flex-col border border-foreground/10 bg-background">
        {isReviewAvailable ? null : (
          <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
            {setupMessage}
          </div>
        )}

        {composerError ? (
          <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
            {composerError}
          </div>
        ) : null}

        {error ? (
          <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
            {error.message}
          </div>
        ) : null}

        <Conversation>
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages ? (
              entries.map((entry) => {
                const isActive = activeEntryId === entry.id;
                const attachmentParts = getUserAttachmentParts(entry.attachments);
                const liveResult = isActive ? object ?? entry.result : entry.result;
                const liveStatus =
                  isActive && isLoading ? "streaming" : entry.status;

                return (
                  <div className="space-y-4" key={entry.id}>
                    <Message from="user">
                      <MessageContent className="space-y-4 max-w-2xl">
                        {entry.prompt ? (
                          <MessageResponse>{entry.prompt}</MessageResponse>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            Attachment-only review request.
                          </p>
                        )}

                        {attachmentParts.length > 0 ? (
                          <Attachments variant="list">
                            {attachmentParts.map((part, index) => (
                              <Attachment
                                data={{
                                  ...part,
                                  id: `${entry.id}-${index}-${part.filename ?? "attachment"}`,
                                }}
                                key={`${entry.id}-${index}-${part.filename ?? "attachment"}`}
                              >
                                <AttachmentPreview />
                                <AttachmentInfo showMediaType />
                              </Attachment>
                            ))}
                          </Attachments>
                        ) : null}
                      </MessageContent>
                    </Message>

                    <Message from="assistant">
                      <MessageContent className="space-y-3 max-w-3xl">
                        <ContentReviewResultCard
                          errorMessage={entry.errorMessage}
                          result={liveResult}
                          status={liveStatus}
                        />

                        {liveStatus !== "streaming" ? (
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handleRetry(entry)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              <ArrowClockwiseIcon className="size-3.5" />
                              Replay review
                            </Button>
                          </div>
                        ) : null}
                      </MessageContent>
                    </Message>
                  </div>
                );
              })
            ) : (
              <ConversationEmptyState
                description="Send text, screenshots, or PDFs. The assistant message streams a structured review result object directly into the thread."
                icon={<ShieldCheckIcon className="size-5" />}
                title="Structured review workspace is ready"
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput onSubmit={({ text }) => handleSubmit(text)}>
              <PromptInputBody>
                {pendingAttachments.length > 0 ? (
                  <Attachments className="mb-3" variant="list">
                    {pendingAttachments.map((attachment) => (
                      <Attachment
                        data={{
                          filename: attachment.file.name,
                          id: attachment.id,
                          mediaType:
                            attachment.file.type || "application/octet-stream",
                          type: "file",
                          url: attachment.previewUrl,
                        }}
                        key={attachment.id}
                      >
                        <AttachmentPreview />
                        <AttachmentInfo showMediaType />
                        <AttachmentRemove
                          onClick={() => removePendingAttachment(attachment.id)}
                        />
                      </Attachment>
                    ))}
                  </Attachments>
                ) : null}
                <PromptInputTextarea
                  disabled={!isReviewAvailable || isLoading}
                  placeholder="Describe what should be reviewed, attach images or PDFs, and watch the structured review object stream into the assistant message."
                />
              </PromptInputBody>
              <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    accept="image/*,application/pdf"
                    className="hidden"
                    multiple
                    onChange={(event) => appendFiles(event.target.files)}
                    ref={fileInputRef}
                    type="file"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <PaperclipIcon className="size-3.5" />
                    Attach
                  </Button>
                  <Badge variant="outline">Structured output</Badge>
                  <Badge variant="outline">useObject</Badge>
                  <Badge variant="outline">{chatModel}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <Button
                      onClick={handleStop}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <StopIcon className="size-3.5" />
                      Stop
                    </Button>
                  ) : null}
                  <PromptInputSubmit disabled={!isReviewAvailable || isLoading} />
                </div>
              </PromptInputFooter>
            </PromptInput>

            {!hasMessages ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {samplePrompts.map((prompt) => (
                  <Button
                    className={cn("max-w-full justify-start text-left")}
                    disabled={!isReviewAvailable || isLoading}
                    key={prompt}
                    onClick={() => handleSubmit(prompt)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <aside className="grid content-start gap-4 border border-foreground/10 bg-background px-4 py-4">
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Runtime
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {isReviewAvailable ? "Ready" : "Setup required"}
            </Badge>
            <Badge variant="outline">{chatModel}</Badge>
            <Badge variant="outline">Node {nodeVersion.replace(/^v/, "")}</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Input contract
          </p>
          <p className="text-muted-foreground text-sm/relaxed">
            One request can combine freeform text with image and PDF
            attachments. The backend streams a single content-review object.
          </p>
          <div className="flex flex-wrap gap-2">
            {acceptedMediaTypes.map((mediaType) => (
              <Badge key={mediaType} variant="outline">
                {mediaType}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Output shape
          </p>
          <p className="text-muted-foreground text-sm/relaxed">
            The assistant card is driven by a streamed object with decision,
            risk score, findings, evidence, recommended action, and open
            questions.
          </p>
        </div>
      </aside>
    </div>
  );
}
