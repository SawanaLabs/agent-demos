import { describe, expect, it, vi } from "vitest";

import { applyUltraChatbotAgentSandboxApproval } from "./ultra-chatbot-agent-sandbox-approval";

describe("ultra chatbot agent sandbox approval", () => {
  it("persists the enabled chat capability before resolving HITL approval", async () => {
    const events: string[] = [];

    await applyUltraChatbotAgentSandboxApproval({
      addToolApprovalResponse: vi.fn(() => {
        events.push("approval:true");
      }),
      approvalId: "approval-1",
      approved: true,
      persistSandboxCapability: vi.fn(async (sandboxEnabled) => {
        events.push(`persist:${sandboxEnabled}`);
      }),
      reason: "The reviewer approved sandbox for this chat.",
    });

    expect(events).toEqual(["persist:true", "approval:true"]);
  });

  it("persists the disabled chat capability before resolving HITL rejection", async () => {
    const events: string[] = [];

    await applyUltraChatbotAgentSandboxApproval({
      addToolApprovalResponse: vi.fn(() => {
        events.push("approval:false");
      }),
      approvalId: "approval-1",
      approved: false,
      persistSandboxCapability: vi.fn(async (sandboxEnabled) => {
        events.push(`persist:${sandboxEnabled}`);
      }),
      reason: "The reviewer kept sandbox disabled for this chat.",
    });

    expect(events).toEqual(["persist:false", "approval:false"]);
  });

  it("does not resolve HITL when capability persistence fails", async () => {
    const addToolApprovalResponse = vi.fn();

    await expect(
      applyUltraChatbotAgentSandboxApproval({
        addToolApprovalResponse,
        approvalId: "approval-1",
        approved: true,
        persistSandboxCapability: vi.fn(async () => {
          throw new Error("Failed to update sandbox capability.");
        }),
        reason: "The reviewer approved sandbox for this chat.",
      })
    ).rejects.toThrow("Failed to update sandbox capability.");

    expect(addToolApprovalResponse).not.toHaveBeenCalled();
  });
});
