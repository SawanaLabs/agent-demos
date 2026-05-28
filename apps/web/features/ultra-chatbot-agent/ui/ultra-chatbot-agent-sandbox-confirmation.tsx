"use client";

import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@workspace/ui/components/ai-elements/confirmation";
import type { ChatAddToolApproveResponseFunction, ToolUIPart } from "ai";

interface SandboxApprovalToolInput {
  reason?: string;
  requestedToolFamilies?: string[];
}

function getSandboxApprovalToolInput(
  part: ToolUIPart
): SandboxApprovalToolInput {
  if (
    typeof part.input !== "object" ||
    part.input === null ||
    Array.isArray(part.input)
  ) {
    return {};
  }

  return part.input as SandboxApprovalToolInput;
}

export interface UltraChatbotAgentSandboxConfirmationProps {
  onApprovalResponse: ChatAddToolApproveResponseFunction;
  onCapabilityChange?: (sandboxEnabled: boolean) => void;
  part: ToolUIPart;
}

export function UltraChatbotAgentSandboxConfirmation({
  onCapabilityChange,
  onApprovalResponse,
  part,
}: UltraChatbotAgentSandboxConfirmationProps) {
  const approval = part.approval;

  if (!approval || part.type !== "tool-enableSandbox") {
    return null;
  }

  const input = getSandboxApprovalToolInput(part);
  const requestedToolFamilies = input.requestedToolFamilies ?? [];

  return (
    <Confirmation
      approval={approval}
      className="border-amber-500/30 bg-amber-500/5"
      state={part.state}
    >
      <ConfirmationTitle>Enable sandbox for this chat?</ConfirmationTitle>
      <ConfirmationRequest>
        <div className="space-y-2 text-sm">
          <p>
            The agent needs sandbox-backed tools before it can continue with
            this request.
          </p>
          {input.reason ? (
            <p className="text-muted-foreground">{input.reason}</p>
          ) : null}
          {requestedToolFamilies.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs">
              {requestedToolFamilies.map((toolFamily) => (
                <span
                  className="border border-foreground/10 px-2 py-1 text-muted-foreground"
                  key={toolFamily}
                >
                  {toolFamily}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </ConfirmationRequest>
      <ConfirmationAccepted>
        <CheckCircleIcon className="size-4" />
        <span>Sandbox is enabled for this chat. The agent can continue.</span>
      </ConfirmationAccepted>
      <ConfirmationRejected>
        <XCircleIcon className="size-4" />
        <span>
          Sandbox stayed disabled. The agent will continue without it.
        </span>
      </ConfirmationRejected>
      <ConfirmationActions>
        <ConfirmationAction
          onClick={() => {
            onApprovalResponse({
              approved: false,
              id: approval.id,
              reason: "The reviewer kept sandbox disabled for this chat.",
            });
            onCapabilityChange?.(false);
          }}
          variant="outline"
        >
          <XCircleIcon className="size-3.5" />
          Keep disabled
        </ConfirmationAction>
        <ConfirmationAction
          onClick={() => {
            onApprovalResponse({
              approved: true,
              id: approval.id,
              reason: "The reviewer approved sandbox for this chat.",
            });
            onCapabilityChange?.(true);
          }}
        >
          <CheckCircleIcon className="size-3.5" />
          Enable sandbox
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  );
}
