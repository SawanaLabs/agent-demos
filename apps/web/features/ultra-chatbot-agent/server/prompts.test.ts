import { describe, expect, it } from "vitest";

import { getUltraChatbotAgentSystemPrompt } from "./prompts";

describe("ultra chatbot agent prompts", () => {
  it("routes code artifact requests through the persisted artifact tool", () => {
    expect(getUltraChatbotAgentSystemPrompt()).toContain(
      'When the user asks for code they may inspect or edit later, use createDocument with kind "code".'
    );
  });
});
