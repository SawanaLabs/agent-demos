"use client";

import { PaperclipIcon } from "@phosphor-icons/react";
import { Attachments } from "@/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChatStatus, UIMessage } from "ai";
import type { ClipboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ultraChatbotAgentAcceptedUploadMediaTypes } from "@/lib/ultra-chatbot-agent/attachment-config";
import {
  UltraChatbotAgentPreviewAttachment,
  type UltraChatbotAgentPreviewAttachmentData,
} from "./ultra-chatbot-agent-preview-attachment";

interface PendingUltraChatbotAgentAttachment {
  file: File;
  id: string;
  previewUrl: string;
}

function buildPendingAttachment(
  file: File
): PendingUltraChatbotAgentAttachment {
  return {
    file,
    id: `${file.name}-${file.size}-${file.lastModified}`,
    previewUrl: URL.createObjectURL(file),
  };
}

function revokePendingAttachment(
  attachment: PendingUltraChatbotAgentAttachment
) {
  URL.revokeObjectURL(attachment.previewUrl);
}

function toPreviewData(
  attachment: PendingUltraChatbotAgentAttachment
): UltraChatbotAgentPreviewAttachmentData {
  return {
    filename: attachment.file.name,
    id: attachment.id,
    mediaType: attachment.file.type || "application/octet-stream",
    type: "file",
    url: attachment.previewUrl,
  };
}

async function uploadUltraChatbotAgentAttachment(file: File, chatId: string) {
  const formData = new FormData();
  formData.append("chatId", chatId);
  formData.append("file", file);

  const response = await fetch("/api/demos/ultra-chatbot-agent/files/upload", {
    body: formData,
    credentials: "include",
    method: "POST",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    throw new Error(payload?.error || "Failed to upload the attachment.");
  }

  const payload = (await response.json()) as {
    contentType: string | null;
    url: string;
  };

  return {
    filename: file.name,
    mediaType: payload.contentType || file.type || "application/octet-stream",
    type: "file" as const,
    url: payload.url,
  };
}

export interface UltraChatbotAgentMultimodalInputProps {
  chatId: string;
  disabled: boolean;
  footerBelow?: ReactNode;
  footerLeading: ReactNode;
  onComposerErrorChange: (message: string | null) => void;
  onSend: (parts: UIMessage["parts"]) => Promise<void>;
  onStop: () => void;
  placeholder: string;
  status: ChatStatus;
}

export function UltraChatbotAgentMultimodalInput({
  chatId,
  disabled,
  footerBelow,
  footerLeading,
  onComposerErrorChange,
  onSend,
  onStop,
  placeholder,
  status,
}: UltraChatbotAgentMultimodalInputProps) {
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingUltraChatbotAgentAttachment[]
  >([]);
  const [uploadingAttachmentIds, setUploadingAttachmentIds] = useState<
    string[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingAttachmentsRef = useRef<PendingUltraChatbotAgentAttachment[]>(
    []
  );
  const isUploading = uploadingAttachmentIds.length > 0;

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  useEffect(
    () => () => {
      for (const attachment of pendingAttachmentsRef.current) {
        revokePendingAttachment(attachment);
      }
    },
    []
  );

  const clearFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const appendFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      onComposerErrorChange(null);
      const nextAttachments = files.map(buildPendingAttachment);

      setPendingAttachments((current) => {
        const replacedIds = new Set(
          nextAttachments.map((attachment) => attachment.id)
        );

        for (const attachment of current) {
          if (replacedIds.has(attachment.id)) {
            revokePendingAttachment(attachment);
          }
        }

        const preserved = current.filter(
          (attachment) => !replacedIds.has(attachment.id)
        );

        return [...preserved, ...nextAttachments];
      });
      clearFileInput();
    },
    [clearFileInput, onComposerErrorChange]
  );

  const removePendingAttachment = useCallback(
    (attachmentId: string) => {
      setPendingAttachments((current) => {
        const attachment = current.find((item) => item.id === attachmentId);

        if (attachment) {
          revokePendingAttachment(attachment);
        }

        return current.filter((item) => item.id !== attachmentId);
      });
      clearFileInput();
    },
    [clearFileInput]
  );

  const previewAttachments = useMemo(
    () => pendingAttachments.map((attachment) => toPreviewData(attachment)),
    [pendingAttachments]
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = event.clipboardData?.items;

      if (!items) {
        return;
      }

      const imageFiles = Array.from(items)
        .filter(
          (item) => item.kind === "file" && item.type.startsWith("image/")
        )
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      if (imageFiles.length === 0) {
        return;
      }

      event.preventDefault();
      appendFiles(imageFiles);
    },
    [appendFiles]
  );

  const handleSend = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();

      if (!trimmedText && pendingAttachments.length === 0) {
        return;
      }

      onComposerErrorChange(null);
      setUploadingAttachmentIds(
        pendingAttachments.map((attachment) => attachment.id)
      );

      try {
        const uploadedFileParts = await Promise.all(
          pendingAttachments.map((attachment) =>
            uploadUltraChatbotAgentAttachment(attachment.file, chatId)
          )
        );
        const parts = [
          ...uploadedFileParts,
          ...(trimmedText.length > 0
            ? [{ text: trimmedText, type: "text" as const }]
            : []),
        ];

        await onSend(parts);
        setPendingAttachments((current) => {
          for (const attachment of current) {
            revokePendingAttachment(attachment);
          }

          return [];
        });
        clearFileInput();
      } catch (error) {
        onComposerErrorChange(
          error instanceof Error
            ? error.message
            : "Failed to upload the attachment."
        );
        throw error;
      } finally {
        setUploadingAttachmentIds([]);
      }
    },
    [chatId, clearFileInput, onComposerErrorChange, onSend, pendingAttachments]
  );

  return (
    <div className="space-y-3">
      <input
        accept={ultraChatbotAgentAcceptedUploadMediaTypes.join(",")}
        className="sr-only"
        multiple
        onChange={(event) => appendFiles(Array.from(event.target.files ?? []))}
        ref={fileInputRef}
        type="file"
      />
      <PromptInput onSubmit={({ text }) => handleSend(text)}>
        <PromptInputBody>
          {previewAttachments.length > 0 ? (
            <Attachments className="mb-3" variant="list">
              {previewAttachments.map((attachment) => (
                <UltraChatbotAgentPreviewAttachment
                  attachment={attachment}
                  isUploading={uploadingAttachmentIds.includes(attachment.id)}
                  key={attachment.id}
                  onRemove={() => removePendingAttachment(attachment.id)}
                />
              ))}
            </Attachments>
          ) : null}
          <PromptInputTextarea
            disabled={disabled || isUploading}
            onPaste={handlePaste}
            placeholder={placeholder}
          />
        </PromptInputBody>
        <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {footerLeading}
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={disabled || isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <PaperclipIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add image or PDF</TooltipContent>
            </Tooltip>
            <PromptInputSubmit
              disabled={disabled || isUploading}
              onStop={onStop}
              status={isUploading ? "submitted" : status}
            />
          </div>
        </PromptInputFooter>
      </PromptInput>
      {footerBelow}
    </div>
  );
}
