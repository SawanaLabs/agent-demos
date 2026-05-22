"use client";

import { Chat, useChat } from "@ai-sdk/react";
import { ArrowClockwiseIcon, ImagesIcon, PaperclipIcon, StopIcon, XIcon } from "@phosphor-icons/react";
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
import { DefaultChatTransport, type FileUIPart, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  convertFilesToParts,
  type PendingAttachment,
} from "./convert-files-to-parts";

function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function getFileParts(message: UIMessage) {
  return message.parts.filter(
    (part): part is FileUIPart => part.type === "file"
  );
}

function buildPendingAttachment(file: File): PendingAttachment {
  return {
    file,
    id: `${file.name}-${file.size}-${file.lastModified}`,
    previewUrl: URL.createObjectURL(file),
  };
}

export interface MultimodalChatbotWorkspaceProps {
  acceptedMediaTypes: string[];
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
}

export function MultimodalChatbotWorkspace({
  acceptedMediaTypes,
  chatModel,
  isChatAvailable,
  nodeVersion,
  setupMessage,
}: MultimodalChatbotWorkspaceProps) {
  const [chat] = useState(
    () =>
      new Chat({
        transport: new DefaultChatTransport({
          api: "/api/demos/multimodal-chatbot",
        }),
      })
  );
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [composerError, setComposerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);
  const { error, messages, regenerate, sendMessage, status, stop } = useChat({
    chat,
  });

  const hasMessages = messages.length > 0;
  const isBusy = status === "submitted" || status === "streaming";
  const samplePrompts = useMemo(
    () => [
      "Summarize the uploaded PDF in three bullets.",
      "What stands out in this image?",
      "Compare the text in the PDF with the diagram screenshot.",
    ],
    []
  );

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  useEffect(() => {
    return () => {
      for (const attachment of pendingAttachmentsRef.current) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    };
  }, []);

  function clearPendingAttachments() {
    setPendingAttachments((current) => {
      for (const attachment of current) {
        URL.revokeObjectURL(attachment.previewUrl);
      }

      return [];
    });
  }

  async function handleSend(text: string) {
    const trimmedText = text.trim();

    if (!trimmedText && pendingAttachments.length === 0) {
      return;
    }

    try {
      setComposerError(null);
      const fileParts = await convertFilesToParts(
        pendingAttachments.map((attachment) => attachment.file)
      );
      const parts = trimmedText
        ? [{ type: "text" as const, text: trimmedText }, ...fileParts]
        : fileParts;

      sendMessage({
        role: "user",
        parts,
      });
      clearPendingAttachments();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (attachmentError) {
      setComposerError(
        attachmentError instanceof Error
          ? attachmentError.message
          : "Failed to prepare attachments."
      );
    }
  }

  function appendFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const nextAttachments = Array.from(fileList).map(buildPendingAttachment);
    setPendingAttachments((current) => {
      const byId = new Map(current.map((attachment) => [attachment.id, attachment]));

      for (const attachment of nextAttachments) {
        byId.set(attachment.id, attachment);
      }

      return Array.from(byId.values());
    });
  }

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

        {composerError ? (
          <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
            {composerError}
          </div>
        ) : null}

        <Conversation>
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages ? (
              messages.map((message) => {
                const text = getTextContent(message);
                const fileParts = getFileParts(message);

                return (
                  <Message from={message.role} key={message.id}>
                    <MessageContent
                      className={cn(
                        "space-y-4",
                        message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
                      )}
                    >
                      {text ? <MessageResponse>{text}</MessageResponse> : null}

                      {fileParts.length > 0 ? (
                        <Attachments variant="list">
                          {fileParts.map((part, index) => (
                            <Attachment
                              data={{
                                ...part,
                                id: `${message.id}-${index}-${part.filename ?? "attachment"}`,
                              }}
                              key={`${message.id}-${index}-${part.filename ?? "attachment"}`}
                            >
                              <AttachmentPreview />
                              <AttachmentInfo showMediaType />
                            </Attachment>
                          ))}
                        </Attachments>
                      ) : null}

                      {!text && fileParts.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                          Waiting for visible output.
                        </p>
                      ) : null}
                    </MessageContent>
                  </Message>
                );
              })
            ) : (
              <ConversationEmptyState
                description="Attach an image or PDF, ask a question, and inspect how the same chat surface handles ad-hoc multimodal context without preindexing."
                icon={<ImagesIcon className="size-5" />}
                title="Multi-modal workspace is ready"
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput onSubmit={({ text }) => handleSend(text)}>
              <PromptInputBody>
                {pendingAttachments.length > 0 ? (
                  <Attachments className="mb-3" variant="list">
                    {pendingAttachments.map((attachment) => (
                      <Attachment
                        data={{
                          filename: attachment.file.name,
                          id: attachment.id,
                          mediaType: attachment.file.type,
                          type: "file",
                          url: attachment.previewUrl,
                        }}
                        key={attachment.id}
                        onRemove={() =>
                          setPendingAttachments((current) => {
                            const nextAttachments = current.filter(
                              (item) => item.id !== attachment.id
                            );

                            URL.revokeObjectURL(attachment.previewUrl);
                            return nextAttachments;
                          })
                        }
                      >
                        <AttachmentPreview />
                        <AttachmentInfo showMediaType />
                        <AttachmentRemove>
                          <XIcon className="size-4" />
                        </AttachmentRemove>
                      </Attachment>
                    ))}
                  </Attachments>
                ) : null}
                <PromptInputTextarea
                  disabled={!isChatAvailable || isBusy}
                  placeholder="Ask about an uploaded image or PDF. The message will carry the files inline to the model."
                />
              </PromptInputBody>
              <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Multimodal</Badge>
                  <Badge variant="outline">Image + PDF</Badge>
                  <Badge variant="outline">{chatModel}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    accept="image/*,application/pdf"
                    className="sr-only"
                    multiple
                    onChange={(event) => appendFiles(event.target.files)}
                    ref={fileInputRef}
                    type="file"
                  />
                  <Button
                    disabled={!isChatAvailable || isBusy}
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <PaperclipIcon className="size-3.5" />
                    Attach
                  </Button>
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
                    <ImagesIcon className="size-3.5" />
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
              Input contract
            </p>
            <p className="mt-1 text-sm">
              This workspace sends image and PDF attachments inline as message
              parts, matching the official AI SDK multimodal guide.
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Accepted media
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {acceptedMediaTypes.map((mediaType) => (
                <Badge key={mediaType} variant="outline">
                  {mediaType}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Demo role
            </p>
            <p className="mt-1 text-sm">
              Use this slice when users bring ad-hoc files into the chat and
              need model reasoning without an indexing pipeline.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
