import { describe, expect, it } from "vitest";

import {
  getOpenAiAgentsSdkDemoHandoffCatalog,
  getOpenAiAgentsSdkDemoHandoffUsageMetadata,
} from "./handoffs";

describe("openai agents sdk demo handoffs", () => {
  it("extracts real handoff usage metadata from run items", () => {
    expect(
      getOpenAiAgentsSdkDemoHandoffUsageMetadata({
        activeAgentName: "Research Memo Agent",
        newItems: [
          {
            rawItem: {
              agent: {
                name: "Market Context Agent",
              },
              type: "handoff_call_item",
            },
          },
          {
            rawItem: {
              sourceAgent: {
                name: "OpenAI Agents SDK Demo",
              },
              targetAgent: {
                name: "Research Memo Agent",
              },
              type: "handoff_output_item",
            },
          },
        ],
      } as never)
    ).toEqual({
      handoffSummary: {
        activeAgentName: "Research Memo Agent",
        handoffTargetNames: ["Market Context Agent"],
        handoffTransitions: ["OpenAI Agents SDK Demo -> Research Memo Agent"],
      },
      usedGuideIds: ["handoffs"],
    });
  });

  it("describes the configured handoff surface before a run starts", () => {
    expect(
      getOpenAiAgentsSdkDemoHandoffCatalog({
        isChatAvailable: true,
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          availability: "configured",
          kind: "agent",
          name: "Market Context Agent",
          sdkPrimitive: "handoffs: [agent]",
        }),
        expect.objectContaining({
          availability: "configured",
          kind: "handoff",
          name: "Research Lead handoff",
          sdkPrimitive: "handoff()",
        }),
      ])
    );
  });
});
