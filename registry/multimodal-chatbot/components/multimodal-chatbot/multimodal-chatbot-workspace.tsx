"use client";

import {
  ArrowClockwiseIcon,
  ImagesIcon,
  PaperclipIcon,
  StopIcon,
  XIcon,
} from "@phosphor-icons/react";
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
import type { ChatStatus, UIMessage } from "ai";
import type { RefObject } from "react";

import {
  getMultimodalFileParts,
  getMultimodalMessageText,
  type PendingAttachment,
} from "./multimodal-chatbot-session";
import { useMultimodalChatbotWorkspace } from "./use-multimodal-chatbot-workspace";

export interface MultimodalChatbotWorkspaceProps {
  acceptedMediaTypes: string[];
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
}

interface MultimodalConversationProps {
  hasMessages: boolean;
  messages: UIMessage[];
}

function MultimodalConversation({
  hasMessages,
  messages,
}: MultimodalConversationProps) {
  return (
    <Conversation className="min-h-0">
      <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
        {hasMessages ? (
          messages.map((message) => (
            <MultimodalMessage key={message.id} message={message} />
          ))
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
  );
}

function MultimodalMessage({ message }: { message: UIMessage }) {
  const text = getMultimodalMessageText(message);
  const fileParts = getMultimodalFileParts(message);

  return (
    <Message from={message.role}>
      <MessageContent
        className={cn(
          "space-y-4",
          message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
        )}
      >
        {text ? <MessageResponse>{text}</MessageResponse> : null}

        {fileParts.length > 0 ? (
          <Attachments variant="list">
            {fileParts.map((part) => {
              const attachmentId = `${message.id}-${part.filename ?? "attachment"}-${part.url}`;

              return (
                <Attachment
                  data={{
                    ...part,
                    id: attachmentId,
                  }}
                  key={attachmentId}
                >
                  <AttachmentPreview />
                  <AttachmentInfo showMediaType />
                </Attachment>
              );
            })}
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
}

interface MultimodalComposerProps {
  chatModel: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  hasMessages: boolean;
  isBusy: boolean;
  isChatAvailable: boolean;
  onAppendFiles: (fileList: FileList | null) => void;
  onRegenerateLastTurn: () => void;
  onRemovePendingAttachment: (attachmentId: string) => void;
  onSend: (text: string) => Promise<void>;
  onSendSamplePrompt: (text: string) => void;
  onStopChat: () => void;
  pendingAttachments: PendingAttachment[];
  samplePrompts: readonly string[];
  status: ChatStatus;
}

function MultimodalComposer({
  chatModel,
  fileInputRef,
  hasMessages,
  isBusy,
  isChatAvailable,
  pendingAttachments,
  samplePrompts,
  status,
  onAppendFiles,
  onRegenerateLastTurn,
  onRemovePendingAttachment,
  onSend,
  onSendSamplePrompt,
  onStopChat,
}: MultimodalComposerProps) {
  return (
    <div className="border-foreground/10 border-t px-4 py-4">
      <div className="mx-auto w-full max-w-3xl">
        <PromptInput
          onSubmit={({ text }) => {
            onSend(text);
          }}
        >
          <PromptInputBody>
            <PendingAttachmentList
              attachments={pendingAttachments}
              onRemoveAttachment={onRemovePendingAttachment}
            />
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
                onChange={(event) => onAppendFiles(event.target.files)}
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
                  onClick={onStopChat}
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
                  onClick={onRegenerateLastTurn}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ArrowClockwiseIcon className="size-3.5" />
                  Retry
                </Button>
              ) : null}
              <PromptInputSubmit disabled={!isChatAvailable} status={status} />
            </div>
          </PromptInputFooter>
        </PromptInput>

        {hasMessages ? null : (
          <MultimodalSamplePrompts
            onSendSamplePrompt={onSendSamplePrompt}
            prompts={samplePrompts}
          />
        )}
      </div>
    </div>
  );
}

function PendingAttachmentList({
  attachments,
  onRemoveAttachment,
}: {
  attachments: PendingAttachment[];
  onRemoveAttachment: (attachmentId: string) => void;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <Attachments className="mb-3" variant="list">
      {attachments.map((attachment) => (
        <Attachment
          data={{
            filename: attachment.file.name,
            id: attachment.id,
            mediaType: attachment.file.type,
            type: "file",
            url: attachment.previewUrl,
          }}
          key={attachment.id}
          onRemove={() => onRemoveAttachment(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentInfo showMediaType />
          <AttachmentRemove>
            <XIcon className="size-4" />
          </AttachmentRemove>
        </Attachment>
      ))}
    </Attachments>
  );
}

function MultimodalSamplePrompts({
  prompts,
  onSendSamplePrompt,
}: {
  prompts: readonly string[];
  onSendSamplePrompt: (text: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <Button
          key={prompt}
          onClick={() => onSendSamplePrompt(prompt)}
          size="sm"
          type="button"
          variant="outline"
        >
          <ImagesIcon className="size-3.5" />
          {prompt}
        </Button>
      ))}
    </div>
  );
}

function MultimodalSidebar({
  acceptedMediaTypes,
  nodeVersion,
}: {
  acceptedMediaTypes: string[];
  nodeVersion: string;
}) {
  return (
    <aside className="border border-foreground/10 bg-background p-4 lg:min-h-0 lg:overflow-y-auto">
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
            Use this slice when users bring ad-hoc files into the chat and need
            model reasoning without an indexing pipeline.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MultimodalChatbotWorkspace({
  acceptedMediaTypes,
  chatModel,
  isChatAvailable,
  nodeVersion,
  setupMessage,
}: MultimodalChatbotWorkspaceProps) {
  const controller = useMultimodalChatbotWorkspace();

  return (
    <div className="grid min-h-[70svh] gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex min-h-[70svh] flex-col border border-foreground/10 bg-background lg:h-full lg:min-h-0">
        {isChatAvailable ? null : (
          <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
            {setupMessage}
          </div>
        )}

        {controller.chatErrorMessage ? (
          <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
            {controller.chatErrorMessage}
          </div>
        ) : null}

        {controller.composerError ? (
          <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
            {controller.composerError}
          </div>
        ) : null}

        <MultimodalConversation
          hasMessages={controller.hasMessages}
          messages={controller.messages}
        />
        <MultimodalComposer
          chatModel={chatModel}
          fileInputRef={controller.fileInputRef}
          hasMessages={controller.hasMessages}
          isBusy={controller.isBusy}
          isChatAvailable={isChatAvailable}
          onAppendFiles={controller.appendFiles}
          onRegenerateLastTurn={controller.regenerateLastTurn}
          onRemovePendingAttachment={controller.removePendingAttachment}
          onSend={controller.handleSend}
          onSendSamplePrompt={controller.sendSamplePrompt}
          onStopChat={controller.stopChat}
          pendingAttachments={controller.pendingAttachments}
          samplePrompts={controller.samplePrompts}
          status={controller.status}
        />
      </section>

      <MultimodalSidebar
        acceptedMediaTypes={acceptedMediaTypes}
        nodeVersion={nodeVersion}
      />
    </div>
  );
}
