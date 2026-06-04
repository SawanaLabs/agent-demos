export type UltraChatbotAgentArtifactMode = "edit" | "diff";

export interface UltraChatbotAgentArtifactState {
  mode: UltraChatbotAgentArtifactMode;
  refreshToken: number;
  selectedDocumentId: string | null;
}

export function createInitialUltraChatbotAgentArtifactState(): UltraChatbotAgentArtifactState {
  return {
    mode: "edit",
    refreshToken: 0,
    selectedDocumentId: null,
  };
}

export function openUltraChatbotAgentArtifact(
  state: UltraChatbotAgentArtifactState,
  documentId: string
): UltraChatbotAgentArtifactState {
  return {
    ...state,
    mode: "edit",
    refreshToken: state.refreshToken + 1,
    selectedDocumentId: documentId,
  };
}

export function closeUltraChatbotAgentArtifact(
  state: UltraChatbotAgentArtifactState
): UltraChatbotAgentArtifactState {
  return {
    ...state,
    mode: "edit",
    selectedDocumentId: null,
  };
}

export function refreshUltraChatbotAgentArtifact(
  state: UltraChatbotAgentArtifactState
): UltraChatbotAgentArtifactState {
  return {
    ...state,
    refreshToken: state.refreshToken + 1,
  };
}

export function setUltraChatbotAgentArtifactMode(
  state: UltraChatbotAgentArtifactState,
  mode: UltraChatbotAgentArtifactMode
): UltraChatbotAgentArtifactState {
  return {
    ...state,
    mode,
  };
}

export function setUltraChatbotAgentArtifactSelection(
  state: UltraChatbotAgentArtifactState,
  documentId: string | null
): UltraChatbotAgentArtifactState {
  return {
    ...state,
    mode: "edit",
    selectedDocumentId: documentId,
  };
}
