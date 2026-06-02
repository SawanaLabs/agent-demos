export interface UltraChatbotAgentSandboxApprovalResponse {
  approvalId: string;
  approved: boolean;
  reason: string;
}

export type UltraChatbotAgentSandboxApprovalResponseHandler = (
  response: UltraChatbotAgentSandboxApprovalResponse
) => PromiseLike<void> | void;

interface ApplyUltraChatbotAgentSandboxApprovalInput
  extends UltraChatbotAgentSandboxApprovalResponse {
  addToolApprovalResponse: (response: {
    approved: boolean;
    id: string;
    reason: string;
  }) => PromiseLike<void> | void;
  persistSandboxCapability: (
    sandboxEnabled: boolean
  ) => PromiseLike<void> | void;
}

export async function applyUltraChatbotAgentSandboxApproval({
  addToolApprovalResponse,
  approvalId,
  approved,
  persistSandboxCapability,
  reason,
}: ApplyUltraChatbotAgentSandboxApprovalInput) {
  await persistSandboxCapability(approved);
  await addToolApprovalResponse({
    approved,
    id: approvalId,
    reason,
  });
}
