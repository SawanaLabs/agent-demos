import { describe, expect, it } from "vitest";

import {
  createEveAgentHandle,
  EveSurfaceError,
  runEveAgentTurn,
  toEveUiMessageStreamResponse,
} from "./eve-agent";

const config = {
  instructions: "test instructions",
  model: "model",
  system: "test instructions",
  tools: {},
};

describe("eve agent adapter", () => {
  it("instantiates a class-style Agent export", () => {
    class FakeAgent {
      config: unknown;

      constructor(agentConfig: unknown) {
        this.config = agentConfig;
      }

      streamText() {
        return "streamed";
      }
    }

    const handle = createEveAgentHandle({ Agent: FakeAgent }, config);

    expect(handle.runMethod).toBe("streamText");
    expect((handle.agent as { config: unknown }).config).toBe(config);
  });

  it("instantiates a factory-style createAgent export and runs", async () => {
    const handle = createEveAgentHandle(
      {
        createAgent: () => ({
          run: async () => "ran",
        }),
      },
      config
    );

    expect(handle.runMethod).toBe("run");
    await expect(runEveAgentTurn(handle, { messages: [] })).resolves.toBe(
      "ran"
    );
  });

  it("fails loudly when no agent factory export exists", () => {
    expect(() => createEveAgentHandle({}, config)).toThrow(EveSurfaceError);
  });

  it("fails loudly when the agent has no run method", () => {
    expect(() =>
      createEveAgentHandle({ createAgent: () => ({}) }, config)
    ).toThrow(/run methods/);
  });

  it("converts results exposing toUIMessageStreamResponse", () => {
    const response = Response.json({ ok: true });
    const result = { toUIMessageStreamResponse: () => response };

    expect(toEveUiMessageStreamResponse(result, {})).toBe(response);
  });

  it("passes Response results through", () => {
    const result = Response.json({ ok: true });

    expect(toEveUiMessageStreamResponse(result, {})).toBe(result);
  });

  it("fails loudly for unrecognized run results", () => {
    expect(() => toEveUiMessageStreamResponse({}, {})).toThrow(EveSurfaceError);
  });
});
