"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";

import { getUltraChatbotAgentDocumentArtifactSignature } from "./ultra-chatbot-agent-workspace-api";

export function useUltraChatbotAgentArtifactRefresh(input: {
  messages: UIMessage[];
  refreshArtifact: () => void;
}) {
  const { messages, refreshArtifact } = input;
  const documentArtifactSignatureRef = useRef("");

  useEffect(() => {
    const nextSignature =
      getUltraChatbotAgentDocumentArtifactSignature(messages);

    if (documentArtifactSignatureRef.current === nextSignature) {
      return;
    }

    documentArtifactSignatureRef.current = nextSignature;
    if (nextSignature) {
      refreshArtifact();
    }
  }, [messages, refreshArtifact]);
}
