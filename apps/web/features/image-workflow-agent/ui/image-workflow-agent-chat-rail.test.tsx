import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { createDefaultWorkflowGraph } from "../model/workflow-engine";
import { ImageWorkflowAgentChatRail } from "./image-workflow-agent-chat-rail";
import { getImageResultNode } from "./image-workflow-agent-model";

const setupState = {
  config: {
    baseURL: "https://ai-gateway.vercel.sh/v1/ai",
    chatModel: "openai/gpt-5-mini",
    imageModel: "google/gemini-3.1-flash-lite-image",
  },
  isReady: true,
  issues: [],
  nodeVersion: process.version,
};

describe("ImageWorkflowAgentChatRail", () => {
  it("shows neutral generation progress instead of a workflow error during a manual run", () => {
    const markup = renderToStaticMarkup(
      <ImageWorkflowAgentChatRail
        chatError={undefined}
        hasMessages={false}
        isBusy={true}
        isChatAvailable={true}
        isManualRunPending={true}
        manualError="Workflow is locked while the agent or manual run is still active."
        messageStatus="ready"
        messages={[]}
        onRetryChatError={vi.fn()}
        onSend={vi.fn()}
        onSuggestionClick={vi.fn()}
        resultNode={getImageResultNode(createDefaultWorkflowGraph())}
        setupState={setupState}
        status="generating"
        suggestions={[]}
      />
    );

    expect(markup).toContain("Generating image");
    expect(markup).toContain("Running the current workflow");
    expect(markup).not.toContain("Workflow action failed");
  });
});
