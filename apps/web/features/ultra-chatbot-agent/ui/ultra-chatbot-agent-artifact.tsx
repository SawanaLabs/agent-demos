"use client";

import { FileTextIcon } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";

import type { UltraChatbotAgentArtifactMode } from "./ultra-chatbot-agent-artifact-state";
import { UltraChatbotAgentDocumentBrowser } from "./ultra-chatbot-agent-document-browser";
import { UltraChatbotAgentDocumentDialog } from "./ultra-chatbot-agent-document-dialog";

export function UltraChatbotAgentArtifact({
  chatId,
  disabled,
  mode,
  onClose,
  onModeChange,
  onOpen,
  onRefresh,
  refreshToken,
  selectedDocumentId,
}: {
  chatId: string;
  disabled: boolean;
  mode: UltraChatbotAgentArtifactMode;
  onClose: () => void;
  onModeChange: (mode: UltraChatbotAgentArtifactMode) => void;
  onOpen: (documentId: string) => void;
  onRefresh: () => void;
  refreshToken: number;
  selectedDocumentId: string | null;
}) {
  return (
    <>
      <section className="space-y-4 border border-foreground/10 p-3">
        <div>
          <div className="flex items-center gap-2">
            <FileTextIcon className="size-4 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Artifact
            </p>
            <Badge variant="outline">text</Badge>
          </div>
          <p className="mt-1 text-sm">
            Companion browser for the Ultra artifact port. Open any document
            into a dedicated detail dialog.
          </p>
        </div>
        <UltraChatbotAgentDocumentBrowser
          chatId={chatId}
          disabled={disabled}
          onOpen={onOpen}
          refreshToken={refreshToken}
          selectedDocumentId={selectedDocumentId}
        />
      </section>

      <UltraChatbotAgentDocumentDialog
        chatId={chatId}
        disabled={disabled}
        documentId={selectedDocumentId}
        mode={mode}
        onClose={onClose}
        onModeChange={onModeChange}
        onRefreshArtifact={onRefresh}
        refreshToken={refreshToken}
      />
    </>
  );
}
