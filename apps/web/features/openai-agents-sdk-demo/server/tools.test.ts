import { describe, expect, it } from "vitest";

import { getOpenAiAgentsSdkDemoRunUsageMetadata } from "./tools";

describe("openai agents sdk demo tools", () => {
  it("marks tool_search usage from tool search and image generation run items", () => {
    expect(
      getOpenAiAgentsSdkDemoRunUsageMetadata([
        {
          rawItem: {
            type: "tool_search_call",
          },
        } as never,
        {
          rawItem: {
            type: "image_generation_call",
          },
        } as never,
      ])
    ).toEqual({
      usedGuideIds: ["tools"],
      usedToolNames: ["tool_search", "image_generation"],
    });
  });
});
