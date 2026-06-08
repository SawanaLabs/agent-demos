"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";

import { applyUltraChatbotAgentSandboxApproval } from "./ultra-chatbot-agent-sandbox-approval";
import { saveUltraChatbotAgentCapabilities } from "./ultra-chatbot-agent-workspace-api";
import type { UltraChatbotAgentWorkspaceChatMeta } from "./ultra-chatbot-agent-workspace-model";

function getSandboxCapabilityErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Failed to update sandbox capability.";
}

export function useUltraChatbotAgentSandbox(input: {
  addToolApprovalResponse: (response: {
    approved: boolean;
    id: string;
    reason: string;
  }) => PromiseLike<void> | void;
  chatId: string;
  setChatMeta: Dispatch<SetStateAction<UltraChatbotAgentWorkspaceChatMeta>>;
}) {
  const { addToolApprovalResponse, chatId, setChatMeta } = input;
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [isSandboxUpdating, setIsSandboxUpdating] = useState(false);

  async function persistSandboxCapability(sandboxEnabled: boolean) {
    const capabilities = await saveUltraChatbotAgentCapabilities({
      chatId,
      sandboxEnabled,
    });

    setChatMeta((current) => ({
      ...current,
      capabilities,
      updatedAt: new Date().toISOString(),
    }));
  }

  async function handleSandboxCapabilityChange(sandboxEnabled: boolean) {
    setSandboxError(null);
    setIsSandboxUpdating(true);

    try {
      await persistSandboxCapability(sandboxEnabled);
    } catch (capabilityError) {
      setSandboxError(getSandboxCapabilityErrorMessage(capabilityError));
    } finally {
      setIsSandboxUpdating(false);
    }
  }

  async function handleSandboxApprovalResponse(input: {
    approvalId: string;
    approved: boolean;
    reason: string;
  }) {
    setSandboxError(null);
    setIsSandboxUpdating(true);

    try {
      await applyUltraChatbotAgentSandboxApproval({
        ...input,
        addToolApprovalResponse,
        persistSandboxCapability,
      });
    } catch (approvalError) {
      setSandboxError(getSandboxCapabilityErrorMessage(approvalError));
    } finally {
      setIsSandboxUpdating(false);
    }
  }

  return {
    handleSandboxApprovalResponse,
    handleSandboxCapabilityChange,
    isSandboxUpdating,
    sandboxError,
  };
}
