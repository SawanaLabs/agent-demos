"use client";

import type { ChatStatus, UIMessage } from "ai";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";
import { convertFilesToParts } from "./convert-files-to-parts";
import {
  buildPendingAttachmentId,
  mergePendingAttachments,
  multimodalSamplePrompts,
  type PendingAttachment,
} from "./multimodal-chatbot-session";

interface UseMultimodalChatbotWorkspaceController {
  appendFiles: (fileList: FileList | null) => void;
  chatErrorMessage: string | null;
  composerError: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleSend: (text: string) => Promise<void>;
  hasMessages: boolean;
  isBusy: boolean;
  messages: UIMessage[];
  pendingAttachments: PendingAttachment[];
  regenerateLastTurn: () => void;
  removePendingAttachment: (attachmentId: string) => void;
  samplePrompts: readonly string[];
  sendSamplePrompt: (text: string) => void;
  status: ChatStatus;
  stopChat: () => void;
}

function buildPendingAttachment(file: File): PendingAttachment {
  return {
    file,
    id: buildPendingAttachmentId(file),
    previewUrl: URL.createObjectURL(file),
  };
}

function revokePendingAttachments(attachments: PendingAttachment[]) {
  for (const attachment of attachments) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
}

function clearFileInput(input: HTMLInputElement | null) {
  if (input) {
    input.value = "";
  }
}

export function useMultimodalChatbotWorkspace(): UseMultimodalChatbotWorkspaceController {
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [composerError, setComposerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);
  const {
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    status,
    stop,
  } = useDemoChat({
    api: "/api/demos/multimodal-chatbot",
  });

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  useEffect(
    () => () => {
      revokePendingAttachments(pendingAttachmentsRef.current);
    },
    []
  );

  const clearPendingAttachments = useCallback(() => {
    setPendingAttachments((current) => {
      revokePendingAttachments(current);
      return [];
    });
  }, []);

  const appendFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) {
      return;
    }

    const nextAttachments = Array.from(fileList).map(buildPendingAttachment);
    setPendingAttachments((current) => {
      const replacedIds = new Set(
        nextAttachments.map((attachment) => attachment.id)
      );

      revokePendingAttachments(
        current.filter((attachment) => replacedIds.has(attachment.id))
      );

      return mergePendingAttachments(current, nextAttachments);
    });
  }, []);

  const removePendingAttachment = useCallback((attachmentId: string) => {
    setPendingAttachments((current) => {
      const removedAttachment = current.find(
        (attachment) => attachment.id === attachmentId
      );

      if (removedAttachment) {
        URL.revokeObjectURL(removedAttachment.previewUrl);
      }

      return current.filter((attachment) => attachment.id !== attachmentId);
    });
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
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
          parts,
          role: "user",
        });
        clearPendingAttachments();
        clearFileInput(fileInputRef.current);
      } catch (attachmentError) {
        setComposerError(
          attachmentError instanceof Error
            ? attachmentError.message
            : "Failed to prepare attachments."
        );
      }
    },
    [clearPendingAttachments, pendingAttachments, sendMessage]
  );

  const sendSamplePrompt = useCallback(
    (text: string) => {
      sendMessage({ text });
    },
    [sendMessage]
  );

  return {
    chatErrorMessage: error?.message ?? null,
    composerError,
    fileInputRef,
    hasMessages,
    isBusy,
    messages,
    pendingAttachments,
    samplePrompts: multimodalSamplePrompts,
    status,
    appendFiles,
    handleSend,
    regenerateLastTurn: regenerate,
    removePendingAttachment,
    sendSamplePrompt,
    stopChat: stop,
  };
}
