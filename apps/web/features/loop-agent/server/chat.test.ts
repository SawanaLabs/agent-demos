import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAgentUIStreamResponseMock,
  createAiGatewayMock,
  stepCountIsMock,
  toolLoopAgentMock,
} = vi.hoisted(() => ({
  createAgentUIStreamResponseMock: vi.fn(),
  createAiGatewayMock: vi.fn(),
  stepCountIsMock: vi.fn(),
  toolLoopAgentMock: vi.fn(),
}));

vi.mock("ai", () => ({
  createAgentUIStreamResponse: createAgentUIStreamResponseMock,
  stepCountIs: stepCountIsMock,
  ToolLoopAgent: toolLoopAgentMock,
  tool: vi.fn((config) => config),
}));

vi.mock("@/features/shared/ai-gateway/server/env", () => ({
  createAiGateway: createAiGatewayMock,
}));

import { streamLoopAgent } from "./chat";
import { LOOP_AGENT_PROVIDER_OPTIONS } from "./model";

describe("streamLoopAgent", () => {
  beforeEach(() => {
    createAgentUIStreamResponseMock.mockReset();
    createAiGatewayMock.mockReset();
    stepCountIsMock.mockReset();
    toolLoopAgentMock.mockReset();

    createAgentUIStreamResponseMock.mockReturnValue(
      Response.json({ ok: true })
    );
    createAiGatewayMock.mockReturnValue(
      vi.fn((modelId: string) => `gateway-model:${modelId}`)
    );
    stepCountIsMock.mockReturnValue("stop-when");
    toolLoopAgentMock.mockImplementation(function MockToolLoopAgent(
      this: { settings: unknown },
      settings: unknown
    ) {
      this.settings = settings;
    });
  });

  it("enables reasoning summaries for the loop agent stream", async () => {
    const response = await streamLoopAgent(
      [
        {
          id: "m1",
          parts: [{ text: "triage CASE-1842", type: "text" }],
          role: "user",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "test-key",
      }
    );

    expect(response.status).toBe(200);
    expect(toolLoopAgentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gateway-model:openai/gpt-5-mini",
        providerOptions: LOOP_AGENT_PROVIDER_OPTIONS,
        stopWhen: "stop-when",
      })
    );
    expect(createAgentUIStreamResponseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sendReasoning: true,
      })
    );
  });

  it("requires human approval before executing the escalation tool", async () => {
    await streamLoopAgent(
      [
        {
          id: "m1",
          parts: [{ text: "triage CASE-1842", type: "text" }],
          role: "user",
        },
      ],
      {
        AI_GATEWAY_API_KEY: "test-key",
      }
    );

    const agentSettings = toolLoopAgentMock.mock.calls[0]?.[0] as {
      instructions: string;
      tools: Record<string, { execute: (input: unknown) => unknown }>;
    };
    const approvalTool = agentSettings.tools.requestHumanApproval as {
      needsApproval: boolean;
      execute: (input: unknown) => unknown;
    };

    expect(agentSettings.instructions).toContain(
      "If approval is denied, do not retry"
    );
    expect(approvalTool.needsApproval).toBe(true);
    expect(
      approvalTool.execute({
        action: "escalate",
        caseId: "CASE-1842",
        customerName: "Northstar Analytics",
        customerUpdate:
          "We are escalating your export timeout incident to priority support because the SLA window is at risk.",
        internalHandoff:
          "Route TIC-7789 to priority support with 18 minutes remaining in the response SLA.",
        priority: "high",
        rationale: [
          "Enterprise customer has an active entitlement.",
          "The active ticket is close to the response SLA.",
        ],
      })
    ).toMatchObject({
      approvalStatus: "approved",
      handoffChannel: "priority escalation",
    });
  });
});
