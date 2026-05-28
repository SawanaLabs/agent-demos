import { beforeEach, describe, expect, it, vi } from "vitest";

const aiState = vi.hoisted(() => ({
  generateText: vi.fn(),
}));

const documentStoreState = vi.hoisted(() => ({
  listLatestDocumentsForChat: vi.fn(),
  saveDocument: vi.fn(),
}));

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");

  return {
    ...actual,
    generateText: aiState.generateText,
  };
});

vi.mock("./document-store", () => ({
  createUltraChatbotAgentDocumentStore: vi.fn(() => documentStoreState),
}));

function importUpdateDocumentModule() {
  return import("./update-document");
}

describe("ultra chatbot agent update document tool", () => {
  beforeEach(() => {
    vi.resetModules();
    aiState.generateText.mockReset();
    documentStoreState.listLatestDocumentsForChat.mockReset();
    documentStoreState.saveDocument.mockReset();

    documentStoreState.listLatestDocumentsForChat.mockResolvedValue([
      {
        content:
          "The rollout will happen soon. Teams should prepare and communicate carefully.",
        createdAt: "2026-05-25T00:00:00.000Z",
        id: "2ae89d54-68d8-4948-afca-1880b9ef2690",
        kind: "text",
        title: "Launch brief",
        visitorId: "visitor-1",
      },
    ]);
    aiState.generateText.mockResolvedValue({
      text: "The rollout will proceed in phased waves. Teams should communicate in plain, factual language and confirm approvals before each wave.",
    });
    documentStoreState.saveDocument.mockResolvedValue({
      content:
        "The rollout will proceed in phased waves. Teams should communicate in plain, factual language and confirm approvals before each wave.",
      createdAt: "2026-05-25T00:01:00.000Z",
      id: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      kind: "text",
      title: "Launch brief",
      visitorId: "visitor-1",
    });
  });

  it("rewrites a visitor-owned document from a change description and saves a new version", async () => {
    const { createUltraChatbotAgentUpdateDocumentTool } =
      await importUpdateDocumentModule();

    const artifactTool = createUltraChatbotAgentUpdateDocumentTool({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      model: { provider: "mock" } as never,
      visitorId: "visitor-1",
    });
    const result = await artifactTool.execute?.(
      {
        description:
          "Rewrite this as a tighter enterprise rollout brief with explicit approval guardrails.",
        documentTitle: "Launch brief",
      },
      {} as never
    );

    expect(documentStoreState.listLatestDocumentsForChat).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      limit: 24,
      visitorId: "visitor-1",
    });
    expect(aiState.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.anything(),
        prompt: expect.stringContaining(
          "Rewrite this as a tighter enterprise rollout brief"
        ),
        system: expect.any(String),
      })
    );
    expect(documentStoreState.saveDocument).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      content:
        "The rollout will proceed in phased waves. Teams should communicate in plain, factual language and confirm approvals before each wave.",
      documentId: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      kind: "text",
      title: "Launch brief",
      visitorId: "visitor-1",
    });
    expect(result).toEqual({
      id: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      kind: "text",
      title: "Launch brief",
    });
  });

  it("returns a concrete error when no matching document exists", async () => {
    const { createUltraChatbotAgentUpdateDocumentTool } =
      await importUpdateDocumentModule();
    documentStoreState.listLatestDocumentsForChat.mockResolvedValueOnce([]);

    const artifactTool = createUltraChatbotAgentUpdateDocumentTool({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      model: { provider: "mock" } as never,
      visitorId: "visitor-1",
    });
    const result = await artifactTool.execute?.(
      {
        description: "Rewrite the missing brief.",
        documentTitle: "Missing brief",
      },
      {} as never
    );

    expect(aiState.generateText).not.toHaveBeenCalled();
    expect(result).toEqual({
      error: 'No document found with the title "Missing brief".',
    });
  });
});
