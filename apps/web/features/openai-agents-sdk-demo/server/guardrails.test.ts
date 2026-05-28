import { describe, expect, it } from "vitest";

import { getOpenAiAgentsSdkDemoGuardrails } from "./guardrails";

describe("openai agents sdk demo guardrails", () => {
  it("blocks direct Chinese buy and sell recommendation phrasing", async () => {
    const { outputGuardrails } = getOpenAiAgentsSdkDemoGuardrails();
    const [guardrail] = outputGuardrails;

    if (!guardrail) {
      throw new Error("Expected the investment advice output guardrail.");
    }

    await expect(
      guardrail.execute({
        agentOutput: "建议：强烈买入 Tesla。",
        context: {
          context: {
            researchMode: "company-analysis",
            sessionId: "session_demo_1",
          },
        },
      } as never),
    ).resolves.toMatchObject({
      outputInfo: {
        matchedPolicy: "direct-investment-recommendation",
        researchMode: "company-analysis",
        sessionId: "session_demo_1",
      },
      tripwireTriggered: true,
    });
  });
});
