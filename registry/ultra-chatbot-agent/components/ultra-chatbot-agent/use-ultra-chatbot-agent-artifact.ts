"use client";

import { useCallback, useState } from "react";

import {
  closeUltraChatbotAgentArtifact,
  createInitialUltraChatbotAgentArtifactState,
  openUltraChatbotAgentArtifact,
  refreshUltraChatbotAgentArtifact,
  setUltraChatbotAgentArtifactMode,
  type UltraChatbotAgentArtifactMode,
} from "./ultra-chatbot-agent-artifact-state";

export function useUltraChatbotAgentArtifact() {
  const [artifact, setArtifact] = useState(
    createInitialUltraChatbotAgentArtifactState
  );
  const closeArtifact = useCallback(() => {
    setArtifact((current) => closeUltraChatbotAgentArtifact(current));
  }, []);
  const openArtifact = useCallback((documentId: string) => {
    setArtifact((current) =>
      openUltraChatbotAgentArtifact(current, documentId)
    );
  }, []);
  const refreshArtifact = useCallback(() => {
    setArtifact((current) => refreshUltraChatbotAgentArtifact(current));
  }, []);
  const setMode = useCallback((mode: UltraChatbotAgentArtifactMode) => {
    setArtifact((current) => setUltraChatbotAgentArtifactMode(current, mode));
  }, []);

  return {
    closeArtifact,
    mode: artifact.mode,
    openArtifact,
    refreshArtifact,
    refreshToken: artifact.refreshToken,
    selectedDocumentId: artifact.selectedDocumentId,
    setMode,
  };
}
