"use client";

import { FileTextIcon } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";

import { UltraChatbotAgentArtifactCloseButton } from "./ultra-chatbot-agent-artifact-close-button";
import { UltraChatbotAgentDocumentPanel } from "./ultra-chatbot-agent-document-panel";
import type { UltraChatbotAgentArtifactMode } from "./ultra-chatbot-agent-artifact-state";

export function UltraChatbotAgentArtifact({
  disabled,
  mode,
  onClose,
  onModeChange,
  onSelectedDocumentIdChange,
  refreshToken,
  selectedDocumentId,
}: {
  disabled: boolean;
  mode: UltraChatbotAgentArtifactMode;
  onClose: () => void;
  onModeChange: (mode: UltraChatbotAgentArtifactMode) => void;
  onSelectedDocumentIdChange: (documentId: string | null) => void;
  refreshToken: number;
  selectedDocumentId: string | null;
}) {
  return (
    <section className="space-y-4 border border-foreground/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileTextIcon className="size-4 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Artifact
            </p>
            <Badge variant="outline">text</Badge>
          </div>
          <p className="mt-1 text-sm">
            Companion document surface for the Ultra artifact port. Current
            slice focuses on versioned text artifacts first.
          </p>
        </div>

        {selectedDocumentId ? (
          <UltraChatbotAgentArtifactCloseButton onClose={onClose} />
        ) : null}
      </div>

      <UltraChatbotAgentDocumentPanel
        disabled={disabled}
        mode={mode}
        onModeChange={onModeChange}
        onSelectedDocumentIdChange={onSelectedDocumentIdChange}
        refreshToken={refreshToken}
        selectedDocumentId={selectedDocumentId}
      />
    </section>
  );
}
