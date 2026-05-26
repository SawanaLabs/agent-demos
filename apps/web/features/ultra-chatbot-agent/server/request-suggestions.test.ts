import { beforeEach, describe, expect, it, vi } from "vitest";

const documentStoreState = vi.hoisted(() => ({
  listLatestDocumentsForVisitor: vi.fn(),
}));

const suggestionStoreState = vi.hoisted(() => ({
  replaceSuggestionsForDocumentVersion: vi.fn(),
}));

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

vi.mock("./document-store", () => ({
  createUltraChatbotAgentDocumentStore: vi.fn(() => documentStoreState),
}));

vi.mock("./suggestion-store", () => ({
  createUltraChatbotAgentSuggestionStore: vi.fn(() => suggestionStoreState),
}));

function importRequestSuggestionsModule() {
  return import("./request-suggestions");
}

describe("ultra chatbot agent request suggestions tool", () => {
  beforeEach(() => {
    vi.resetModules();
    documentStoreState.listLatestDocumentsForVisitor.mockReset();
    suggestionStoreState.replaceSuggestionsForDocumentVersion.mockReset();
    aiState.generateObject.mockReset();

    documentStoreState.listLatestDocumentsForVisitor.mockResolvedValue([
      {
        content: "The launch is good but the rollout paragraph is vague.",
        createdAt: "2026-05-25T00:00:00.000Z",
        id: "2ae89d54-68d8-4948-afca-1880b9ef2690",
        kind: "text",
        title: "Launch brief",
        visitorId: "visitor-1",
      },
    ]);
    aiState.generateObject.mockResolvedValue({
      object: {
        suggestions: [
          {
            description: "Names the rollout constraint explicitly.",
            originalText: "The launch is good but the rollout paragraph is vague.",
            suggestedText:
              "The launch brief is solid, but the rollout paragraph should state the guardrails and approval steps explicitly.",
          },
        ],
      },
    });
    suggestionStoreState.replaceSuggestionsForDocumentVersion.mockResolvedValue([
      {
        createdAt: "2026-05-25T00:01:00.000Z",
        description: "Names the rollout constraint explicitly.",
        documentCreatedAt: "2026-05-25T00:00:00.000Z",
        documentId: "2ae89d54-68d8-4948-afca-1880b9ef2690",
        id: "s-1",
        originalText: "The launch is good but the rollout paragraph is vague.",
        suggestedText:
          "The launch brief is solid, but the rollout paragraph should state the guardrails and approval steps explicitly.",
        visitorId: "visitor-1",
      },
    ]);
  });

  it("resolves a visitor-owned document by title, generates suggestions, and persists them", async () => {
    const { createUltraChatbotAgentRequestSuggestionsTool } =
      await importRequestSuggestionsModule();

    const artifactTool = createUltraChatbotAgentRequestSuggestionsTool({
      model: { provider: "mock" } as never,
      visitorId: "visitor-1",
    });
    const result = await artifactTool.execute?.(
      {
        documentTitle: "Launch brief",
      },
      {} as never
    );

    expect(documentStoreState.listLatestDocumentsForVisitor).toHaveBeenCalledWith({
      limit: 24,
      visitorId: "visitor-1",
    });
    expect(aiState.generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.anything(),
        prompt: "The launch is good but the rollout paragraph is vague.",
      })
    );
    expect(
      suggestionStoreState.replaceSuggestionsForDocumentVersion
    ).toHaveBeenCalledWith({
      documentCreatedAt: "2026-05-25T00:00:00.000Z",
      documentId: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      suggestions: [
        {
          description: "Names the rollout constraint explicitly.",
          originalText: "The launch is good but the rollout paragraph is vague.",
          suggestedText:
            "The launch brief is solid, but the rollout paragraph should state the guardrails and approval steps explicitly.",
        },
      ],
      visitorId: "visitor-1",
    });
    expect(result).toEqual({
      id: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      kind: "text",
      suggestionCount: 1,
      title: "Launch brief",
    });
  });

  it("returns a concrete error when no matching document exists", async () => {
    const { createUltraChatbotAgentRequestSuggestionsTool } =
      await importRequestSuggestionsModule();
    documentStoreState.listLatestDocumentsForVisitor.mockResolvedValueOnce([]);

    const artifactTool = createUltraChatbotAgentRequestSuggestionsTool({
      model: { provider: "mock" } as never,
      visitorId: "visitor-1",
    });
    const result = await artifactTool.execute?.(
      {
        documentTitle: "Missing brief",
      },
      {} as never
    );

    expect(aiState.generateObject).not.toHaveBeenCalled();
    expect(result).toEqual({
      error: 'No document found with the title "Missing brief".',
    });
  });
});
