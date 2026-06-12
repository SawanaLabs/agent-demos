import { describe, expect, it } from "vitest";

import { projectGuideCompanionSystemPrompt } from "./chat";

describe("project guide companion chat prompt", () => {
  it("tells the model that MCP evidence is only visible through the companion", () => {
    expect(projectGuideCompanionSystemPrompt).toContain(
      "The visitor cannot directly read your MCP tool results or local repository files."
    );
    expect(projectGuideCompanionSystemPrompt).toContain(
      "translate retrieved evidence into the answer"
    );
  });
});
