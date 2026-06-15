"use client";

import {
  ArrowClockwiseIcon,
  PaperclipIcon,
  ShieldCheckIcon,
  StopIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { FileUIPart } from "ai";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
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
import { useMemo, useRef } from "react";

import { ObjectGenerationResultCard } from "./object-generation-result-card";
import {
  type DisplayReviewThreadEntry,
} from "./object-generation-session";
import { useObjectGenerationSession } from "./use-object-generation-session";

export interface ObjectGenerationWorkspaceProps {
  acceptedMediaTypes: string[];
  chatModel: string;
  isReviewAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
}

function getUserAttachmentParts(attachments: DisplayReviewThreadEntry["attachments"]) {
  return attachments.map(
    (attachment): FileUIPart => ({
      filename: attachment.filename,
      mediaType: attachment.mediaType,
      type: "file",
      url: attachment.previewUrl,
    })
  );
}

export function ObjectGenerationWorkspace({
  acceptedMediaTypes,
  chatModel,
  isReviewAvailable,
  nodeVersion,
  setupMessage,
}: ObjectGenerationWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    composerError,
    entries,
    hasMessages,
    inputResetKey,
    isLoading,
    pendingAttachments,
    streamErrorMessage,
    appendFiles,
    removePendingAttachment,
    retryReview,
    stopReview,
    submitReview,
  } = useObjectGenerationSession();

  const samplePrompts = useMemo(
    () => [
      "Generate a launch-risk object for this pricing page draft and flag unsupported claims.",
      "Read this policy PDF and screenshot, then generate a publishability object with evidence.",
      "Turn the attached assets into a structured moderation object with findings and next action.",
    ],
    []
  );

  return (
    <div className="grid min-h-[70svh] grid-cols-[minmax(0,1fr)] gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex min-h-[70svh] min-w-0 flex-col border border-foreground/10 bg-background lg:h-full lg:min-h-0">
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

        {streamErrorMessage ? (
          <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
            {streamErrorMessage}
          </div>
        ) : null}

        <Conversation className="min-h-0">
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages ? (
              entries.map((entry) => {
                const attachmentParts = getUserAttachmentParts(entry.attachments);

                return (
                  <div className="space-y-4" key={entry.id}>
                    <Message from="user">
                      <MessageContent className="space-y-4 max-w-2xl">
                        {entry.prompt ? (
                          <MessageResponse>{entry.prompt}</MessageResponse>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            Attachment-only object generation request.
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
                        <ObjectGenerationResultCard
                          errorMessage={entry.errorMessage}
                          result={entry.liveResult}
                          status={entry.liveStatus}
                        />

                        {entry.liveStatus !== "streaming" ? (
                          <div className="flex justify-end">
                            <Button
                              onClick={() => retryReview(entry)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              <ArrowClockwiseIcon className="size-3.5" />
                              Replay generation
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
                description="Send text, screenshots, or PDFs. The assistant message streams a structured object directly into the thread."
                icon={<ShieldCheckIcon className="size-5" />}
                title="Object generation workspace is ready"
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput onSubmit={({ text }) => submitReview(text)}>
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
                  placeholder="Describe the object you want, attach images or PDFs, and watch the structured object stream into the assistant message."
                />
              </PromptInputBody>
              <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    accept="image/*,application/pdf"
                    className="hidden"
                    key={inputResetKey}
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
                      onClick={stopReview}
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
                    className={cn(
                      "h-auto min-h-7 min-w-0 max-w-full shrink justify-start whitespace-normal py-1.5 text-left leading-5 [overflow-wrap:anywhere]"
                    )}
                    disabled={!isReviewAvailable || isLoading}
                    key={prompt}
                    onClick={() => submitReview(prompt)}
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

      <aside className="grid min-w-0 content-start gap-4 border border-foreground/10 bg-background px-4 py-4 lg:min-h-0 lg:overflow-y-auto">
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
            attachments. The backend streams a single structured object.
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
