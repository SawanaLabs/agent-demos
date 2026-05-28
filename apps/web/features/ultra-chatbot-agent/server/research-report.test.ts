import { beforeEach, describe, expect, it, vi } from "vitest";

const aiState = vi.hoisted(() => ({
  generateObject: vi.fn(),
}));

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");

  return {
    ...actual,
    generateObject: aiState.generateObject,
  };
});

function importResearchReportModule() {
  return import("./research-report");
}

describe("ultra chatbot agent research report tool", () => {
  beforeEach(() => {
    vi.resetModules();
    aiState.generateObject.mockReset();
    aiState.generateObject.mockResolvedValue({
      object: {
        executiveSummary:
          "Open-source Chinese frontier models are converging on longer-context chat, reasoning, and coding benchmarks.",
        keyFindings: [
          "Kimi emphasizes long-context product workflows.",
          "MiniMax emphasizes broad multimodal assistant coverage.",
        ],
        recommendations: [
          "Compare each model on the target workflow before choosing.",
        ],
        risks: [
          "Benchmarks can drift quickly as providers update hosted models.",
        ],
        sources: [
          {
            title: "Kimi model docs",
            url: "https://platform.moonshot.ai/docs",
          },
        ],
        title: "Kimi vs MiniMax Open Model Brief",
        topic: "Kimi vs MiniMax open-source model comparison",
      },
    });
  });

  it("generates a structured report object from a topic and optional evidence", async () => {
    const { createUltraChatbotAgentResearchReportTool } =
      await importResearchReportModule();

    const reportTool = createUltraChatbotAgentResearchReportTool({
      model: { provider: "mock" } as never,
    });
    const result = await reportTool.execute?.(
      {
        audience: "AI product engineers",
        evidence:
          "Kimi publishes long-context model docs. MiniMax publishes multimodal model docs.",
        topic: "Kimi vs MiniMax open-source model comparison",
      },
      {} as never
    );

    expect(aiState.generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.anything(),
        prompt: expect.stringContaining(
          "Kimi vs MiniMax open-source model comparison"
        ),
        schema: expect.anything(),
        system: expect.stringContaining("structured research report"),
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        kind: "research-report",
        keyFindings: expect.arrayContaining([
          "Kimi emphasizes long-context product workflows.",
        ]),
        title: "Kimi vs MiniMax Open Model Brief",
      })
    );
  });
});
