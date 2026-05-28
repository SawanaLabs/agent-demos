import { describe, expect, it } from "vitest";

import {
  getOpenAiAgentsSdkDemoAiSdkExtensionProfile,
  getOpenAiAgentsSdkDemoAiSdkExtensionUsageMetadata,
} from "./extensions";

describe("openai agents sdk demo AI SDK extension", () => {
  it("exposes the official AI SDK extension profile for the runtime inspector", () => {
    expect(getOpenAiAgentsSdkDemoAiSdkExtensionProfile()).toEqual({
      modelAdapter: {
        status: "not-used",
        notes:
          "Official docs recommend the default OpenAI provider for OpenAI models, and the beta aisdk() model adapter does not support deferred Responses tool loading.",
        sdkPrimitive: "aisdk(model)",
      },
      uiBridge: {
        responseHelper: "createAiSdkUiMessageStreamResponse()",
        sdkPrimitive: "createAiSdkUiMessageStream()",
        status: "configured",
      },
    });
  });

  it("marks the Extensions guide when the maintained AI SDK UI bridge is used", () => {
    expect(getOpenAiAgentsSdkDemoAiSdkExtensionUsageMetadata()).toEqual({
      aiSdkExtensionSummary: {
        modelAdapterStatus: "not-used",
        uiBridgeStatus: "configured",
        usedBridgePrimitive: "createAiSdkUiMessageStream()",
      },
      usedGuideIds: ["extensions-ai-sdk"],
    });
  });
});
