"use client";

import { useState } from "react";

import {
  closeUltraChatbotAgentArtifact,
  createInitialUltraChatbotAgentArtifactState,
  openUltraChatbotAgentArtifact,
  setUltraChatbotAgentArtifactMode,
  setUltraChatbotAgentArtifactSelection,
  type UltraChatbotAgentArtifactMode,
} from "./ultra-chatbot-agent-artifact-state";

export function useUltraChatbotAgentArtifact() {
  const [artifact, setArtifact] = useState(
    createInitialUltraChatbotAgentArtifactState
  );

  return {
    closeArtifact() {
      setArtifact((current) => closeUltraChatbotAgentArtifact(current));
    },
    mode: artifact.mode,
    openArtifact(documentId: string) {
      setArtifact((current) => openUltraChatbotAgentArtifact(current, documentId));
    },
    refreshToken: artifact.refreshToken,
    selectedDocumentId: artifact.selectedDocumentId,
    setMode(mode: UltraChatbotAgentArtifactMode) {
      setArtifact((current) => setUltraChatbotAgentArtifactMode(current, mode));
    },
    setSelectedDocumentId(documentId: string | null) {
      setArtifact((current) =>
        setUltraChatbotAgentArtifactSelection(current, documentId)
      );
    },
  };
}
