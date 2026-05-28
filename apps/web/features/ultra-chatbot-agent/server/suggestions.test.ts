import { beforeEach, describe, expect, it, vi } from "vitest";

const documentStoreState = vi.hoisted(() => ({
  loadLatestDocument: vi.fn(),
}));

const suggestionStoreState = vi.hoisted(() => ({
  listSuggestionsForDocumentVersion: vi.fn(),
}));

vi.mock("./document-store", () => ({
  createUltraChatbotAgentDocumentStore: vi.fn(() => documentStoreState),
}));

vi.mock("./suggestion-store", () => ({
  createUltraChatbotAgentSuggestionStore: vi.fn(() => suggestionStoreState),
}));

function importSuggestionsModule() {
  return import("./suggestions");
}

describe("ultra chatbot agent suggestions route contract", () => {
  beforeEach(() => {
    vi.resetModules();
    documentStoreState.loadLatestDocument.mockReset();
    suggestionStoreState.listSuggestionsForDocumentVersion.mockReset();

    documentStoreState.loadLatestDocument.mockResolvedValue({
      content: "Draft",
      createdAt: "2026-05-25T00:00:00.000Z",
      id: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      kind: "text",
      title: "Launch note",
      visitorId: "visitor-1",
    });
    suggestionStoreState.listSuggestionsForDocumentVersion.mockResolvedValue([
      {
        createdAt: "2026-05-25T00:01:00.000Z",
        description: "Tighten the opening sentence.",
        documentCreatedAt: "2026-05-25T00:00:00.000Z",
        documentId: "2ae89d54-68d8-4948-afca-1880b9ef2690",
        id: "s-1",
        originalText: "Draft",
        suggestedText: "Sharper draft",
        visitorId: "visitor-1",
      },
    ]);
  });

  it("requires a chatId and document id", async () => {
    const suggestionsModule = await importSuggestionsModule();

    const response =
      await suggestionsModule.handleUltraChatbotAgentSuggestionsRequest(
        new Request(
          "http://localhost/api/demos/ultra-chatbot-agent/suggestions"
        ),
        {
          visitorId: "visitor-1",
        }
      );

    expect(response.status).toBe(400);
    expect(documentStoreState.loadLatestDocument).not.toHaveBeenCalled();
  });

  it("lists suggestions for the latest visitor-owned document version", async () => {
    const suggestionsModule = await importSuggestionsModule();

    const response =
      await suggestionsModule.handleUltraChatbotAgentSuggestionsRequest(
        new Request(
          "http://localhost/api/demos/ultra-chatbot-agent/suggestions?chatId=7dad003a-e507-448b-ac02-10937a0290da&id=2ae89d54-68d8-4948-afca-1880b9ef2690"
        ),
        {
          visitorId: "visitor-1",
        }
      );

    expect(response.status).toBe(200);
    expect(documentStoreState.loadLatestDocument).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      documentId: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      visitorId: "visitor-1",
    });
    expect(
      suggestionStoreState.listSuggestionsForDocumentVersion
    ).toHaveBeenCalledWith({
      documentCreatedAt: "2026-05-25T00:00:00.000Z",
      documentId: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      visitorId: "visitor-1",
    });
  });
});
