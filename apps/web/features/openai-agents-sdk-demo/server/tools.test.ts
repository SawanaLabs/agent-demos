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

  it("marks agent orchestration usage when the specialist agent-as-tool runs", () => {
    expect(
      getOpenAiAgentsSdkDemoRunUsageMetadata([
        {
          rawItem: {
            name: "research_memo_agent",
            type: "function_call",
          },
        } as never,
      ])
    ).toEqual({
      usedGuideIds: ["tools", "agent-orchestration"],
      usedToolNames: ["research_memo_agent"],
    });
  });

  it("marks MCP usage when a server-prefixed MCP tool runs", () => {
    expect(
      getOpenAiAgentsSdkDemoRunUsageMetadata([
        {
          rawItem: {
            name: "openai_agents_demo_docs__search_demo_docs",
            type: "function_call",
          },
        } as never,
      ])
    ).toEqual({
      usedGuideIds: ["tools", "mcp"],
      usedToolNames: ["openai_agents_demo_docs__search_demo_docs"],
    });
  });
});
