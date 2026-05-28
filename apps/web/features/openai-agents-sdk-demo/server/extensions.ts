import { z } from "zod";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";

export const openAiAgentsSdkDemoAiSdkExtensionSummarySchema = z.object({
  modelAdapterStatus: z.literal("not-used"),
  uiBridgeStatus: z.literal("configured"),
  usedBridgePrimitive: z.literal("createAiSdkUiMessageStream()"),
});

export interface OpenAiAgentsSdkDemoAiSdkExtensionProfile {
  modelAdapter: {
    notes: string;
    sdkPrimitive: "aisdk(model)";
    status: "not-used";
  };
  uiBridge: {
    responseHelper: "createAiSdkUiMessageStreamResponse()";
    sdkPrimitive: "createAiSdkUiMessageStream()";
    status: "configured";
  };
}

export function getOpenAiAgentsSdkDemoAiSdkExtensionProfile(): OpenAiAgentsSdkDemoAiSdkExtensionProfile {
  return {
    modelAdapter: {
      notes:
        "Official docs recommend the default OpenAI provider for OpenAI models, and the beta aisdk() model adapter does not support deferred Responses tool loading.",
      sdkPrimitive: "aisdk(model)",
      status: "not-used",
    },
    uiBridge: {
      responseHelper: "createAiSdkUiMessageStreamResponse()",
      sdkPrimitive: "createAiSdkUiMessageStream()",
      status: "configured",
    },
  };
}

export function getOpenAiAgentsSdkDemoAiSdkExtensionUsageMetadata() {
  return {
    aiSdkExtensionSummary: {
      modelAdapterStatus: "not-used",
      uiBridgeStatus: "configured",
      usedBridgePrimitive: "createAiSdkUiMessageStream()",
    },
    usedGuideIds: ["extensions-ai-sdk"],
  } satisfies OpenAiAgentsSdkDemoMessageMetadata;
}
