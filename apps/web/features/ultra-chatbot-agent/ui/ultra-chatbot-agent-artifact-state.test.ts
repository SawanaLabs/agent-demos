import { describe, expect, it } from "vitest";

import {
  closeUltraChatbotAgentArtifact,
  createInitialUltraChatbotAgentArtifactState,
  openUltraChatbotAgentArtifact,
  refreshUltraChatbotAgentArtifact,
  setUltraChatbotAgentArtifactMode,
  setUltraChatbotAgentArtifactSelection,
} from "./ultra-chatbot-agent-artifact-state";

describe("ultra chatbot agent artifact state", () => {
  it("opens a document by selecting it and bumping the refresh token", () => {
    const initialState = createInitialUltraChatbotAgentArtifactState();

    expect(openUltraChatbotAgentArtifact(initialState, "doc-1")).toEqual({
      mode: "edit",
      refreshToken: 1,
      selectedDocumentId: "doc-1",
    });
  });

  it("closes the artifact detail without losing the refresh token", () => {
    const openState = openUltraChatbotAgentArtifact(
      createInitialUltraChatbotAgentArtifactState(),
      "doc-1"
    );

    expect(closeUltraChatbotAgentArtifact(openState)).toEqual({
      mode: "edit",
      refreshToken: 1,
      selectedDocumentId: null,
    });
  });

  it("resets the mode when the selection changes", () => {
    const diffState = setUltraChatbotAgentArtifactMode(
      openUltraChatbotAgentArtifact(
        createInitialUltraChatbotAgentArtifactState(),
        "doc-1"
      ),
      "diff"
    );

    expect(setUltraChatbotAgentArtifactSelection(diffState, "doc-2")).toEqual({
      mode: "edit",
      refreshToken: 1,
      selectedDocumentId: "doc-2",
    });
  });

  it("refreshes the current artifact without changing the selection or mode", () => {
    const diffState = setUltraChatbotAgentArtifactMode(
      openUltraChatbotAgentArtifact(
        createInitialUltraChatbotAgentArtifactState(),
        "doc-1"
      ),
      "diff"
    );

    expect(refreshUltraChatbotAgentArtifact(diffState)).toEqual({
      mode: "diff",
      refreshToken: 2,
      selectedDocumentId: "doc-1",
    });
  });
});
