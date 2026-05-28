import { describe, expect, it } from "vitest";

import {
  getOpenAiAgentsSdkDemoVoicePrimarySummary,
  openAiAgentsSdkDemoWorkspaceLayout,
} from "./openai-agents-sdk-demo-workspace-layout";

describe("openai-agents-sdk-demo workspace UI", () => {
  it("pins the workspace to 100svh and moves voice entry to the screen rail dialog flow", () => {
    expect(openAiAgentsSdkDemoWorkspaceLayout.workspaceHeightClassName).toBe(
      "h-[100svh]"
    );
    expect(openAiAgentsSdkDemoWorkspaceLayout.voiceEntrySurface).toBe(
      "screen-rail"
    );
    expect(openAiAgentsSdkDemoWorkspaceLayout.voiceDetailsSurface).toBe(
      "dialog"
    );
    expect(openAiAgentsSdkDemoWorkspaceLayout.voiceEntryTitle).toBe("Voice");
    expect(openAiAgentsSdkDemoWorkspaceLayout.voiceDetailsButtonLabel).toBe(
      "Details"
    );
  });

  it("keeps the screen-rail voice copy compact", () => {
    expect(
      getOpenAiAgentsSdkDemoVoicePrimarySummary({
        connectionStatus: "connected",
        errorMessage: null,
        hasPendingApproval: true,
      })
    ).toBe("Approval pending.");
    expect(
      getOpenAiAgentsSdkDemoVoicePrimarySummary({
        connectionStatus: "disconnected",
        errorMessage: null,
        hasPendingApproval: false,
      })
    ).toBe("Browser lane.");
  });

  it("keeps voice actions inside the rail card and details in the dialog lane", () => {
    expect(openAiAgentsSdkDemoWorkspaceLayout.voiceEntryTitle).toBe("Voice");
    expect(openAiAgentsSdkDemoWorkspaceLayout.voiceDetailsButtonLabel).toBe(
      "Details"
    );
  });
});
