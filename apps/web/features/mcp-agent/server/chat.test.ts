import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAgentUIStreamResponseMock,
  createMcpAgentGatewayMock,
  createMcpAgentToolboxMock,
  stepCountIsMock,
  toolLoopAgentMock,
} = vi.hoisted(() => ({
  createAgentUIStreamResponseMock: vi.fn(),
  createMcpAgentGatewayMock: vi.fn(),
  createMcpAgentToolboxMock: vi.fn(),
  stepCountIsMock: vi.fn(),
  toolLoopAgentMock: vi.fn(),
}));

vi.mock("ai", () => ({
  createAgentUIStreamResponse: createAgentUIStreamResponseMock,
  stepCountIs: stepCountIsMock,
  ToolLoopAgent: toolLoopAgentMock,
}));

vi.mock("./env", async () => {
  const actual = await vi.importActual<typeof import("./env")>("./env");

  return {
    ...actual,
    createMcpAgentGateway: createMcpAgentGatewayMock,
  };
});

vi.mock("./mcp-clients", () => ({
  createMcpAgentToolbox: createMcpAgentToolboxMock,
}));

import { streamMcpAgent } from "./chat";
import { MCP_AGENT_PROVIDER_OPTIONS } from "./model";

describe("streamMcpAgent", () => {
  beforeEach(() => {
    createAgentUIStreamResponseMock.mockReset();
    createMcpAgentGatewayMock.mockReset();
    createMcpAgentToolboxMock.mockReset();
    stepCountIsMock.mockReset();
    toolLoopAgentMock.mockReset();

    createAgentUIStreamResponseMock.mockReturnValue(
      Response.json({ ok: true })
    );
    createMcpAgentGatewayMock.mockReturnValue(
      vi.fn((modelId: string) => `gateway-model:${modelId}`)
    );
    createMcpAgentToolboxMock.mockResolvedValue({
      close: vi.fn(),
      summary: {
        servers: [],
        tools: [],
      },
      tools: {},
    });
    stepCountIsMock.mockReturnValue("stop-when");
    toolLoopAgentMock.mockImplementation(function MockToolLoopAgent(
      this: { settings: unknown },
      settings: unknown
    ) {
      this.settings = settings;
    });
  });

  it("keeps enough loop budget to synthesize an answer after MCP tool reads", async () => {
    const response = await streamMcpAgent(
      [
        {
          id: "m1",
          parts: [{ text: "Review the project docs", type: "text" }],
          role: "user",
        },
      ],
      {
        env: {
          AI_GATEWAY_API_KEY: "test-key",
        },
        origin: "http://localhost:3000",
      }
    );

    expect(response.status).toBe(200);
    expect(stepCountIsMock).toHaveBeenCalledWith(20);
    expect(toolLoopAgentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gateway-model:openai/gpt-5-mini",
        providerOptions: MCP_AGENT_PROVIDER_OPTIONS,
        stopWhen: "stop-when",
      })
    );
    expect(createAgentUIStreamResponseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sendReasoning: true,
      })
    );
  });
});
