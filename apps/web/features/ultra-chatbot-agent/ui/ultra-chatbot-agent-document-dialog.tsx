"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

import type { UltraChatbotAgentArtifactMode } from "./ultra-chatbot-agent-artifact-state";
import { UltraChatbotAgentDocumentDetail } from "./ultra-chatbot-agent-document-detail";

export function UltraChatbotAgentDocumentDialog({
  chatId,
  disabled,
  documentId,
  mode,
  onClose,
  onModeChange,
  onRefreshArtifact,
  refreshToken,
}: {
  chatId: string;
  disabled: boolean;
  documentId: string | null;
  mode: UltraChatbotAgentArtifactMode;
  onClose: () => void;
  onModeChange: (mode: UltraChatbotAgentArtifactMode) => void;
  onRefreshArtifact: () => void;
  refreshToken: number;
}) {
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      open={documentId != null}
    >
      <DialogContent className="grid h-[calc(100svh-3rem)] max-h-[calc(100svh-3rem)] max-w-[min(1100px,calc(100%-2rem))] grid-rows-[auto,minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-[min(1100px,calc(100%-2rem))]">
        <DialogHeader className="border-b border-foreground/10 px-5 py-4">
          <DialogTitle>Document detail</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-5 py-4">
          {documentId ? (
            <UltraChatbotAgentDocumentDetail
              chatId={chatId}
              disabled={disabled}
              documentId={documentId}
              mode={mode}
              onModeChange={onModeChange}
              onRefreshArtifact={onRefreshArtifact}
              refreshToken={refreshToken}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
