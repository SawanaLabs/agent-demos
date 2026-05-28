import { beforeEach, describe, expect, it, vi } from "vitest";

const documentStoreState = vi.hoisted(() => ({
  listLatestDocumentsForChat: vi.fn(),
  saveDocument: vi.fn(),
}));

vi.mock("./document-store", () => ({
  createUltraChatbotAgentDocumentStore: vi.fn(() => documentStoreState),
}));

function importEditDocumentModule() {
  return import("./edit-document");
}

describe("ultra chatbot agent edit document tool", () => {
  beforeEach(() => {
    vi.resetModules();
    documentStoreState.listLatestDocumentsForChat.mockReset();
    documentStoreState.saveDocument.mockReset();

    documentStoreState.listLatestDocumentsForChat.mockResolvedValue([
      {
        content:
          "Launch in phased waves. Keep all rollout language plain and factual.",
        createdAt: "2026-05-25T00:00:00.000Z",
        id: "2ae89d54-68d8-4948-afca-1880b9ef2690",
        kind: "text",
        title: "Launch brief",
        visitorId: "visitor-1",
      },
    ]);
    documentStoreState.saveDocument.mockResolvedValue({
      content:
        "Launch in phased waves. Keep all rollout language compliance-safe, plain, and factual.",
      createdAt: "2026-05-25T00:01:00.000Z",
      id: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      kind: "text",
      title: "Launch brief",
      visitorId: "visitor-1",
    });
  });

  it("replaces a targeted string in a visitor-owned document and saves a new version", async () => {
    const { createUltraChatbotAgentEditDocumentTool } =
      await importEditDocumentModule();

    const artifactTool = createUltraChatbotAgentEditDocumentTool({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      visitorId: "visitor-1",
    });
    const result = await artifactTool.execute?.(
      {
        documentTitle: "Launch brief",
        newText: "compliance-safe, plain, and factual",
        oldText: "plain and factual",
        replaceAll: false,
      },
      {} as never
    );

    expect(documentStoreState.listLatestDocumentsForChat).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      limit: 24,
      visitorId: "visitor-1",
    });
    expect(documentStoreState.saveDocument).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      content:
        "Launch in phased waves. Keep all rollout language compliance-safe, plain, and factual.",
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

  it("returns a concrete error when the old text is missing", async () => {
    const { createUltraChatbotAgentEditDocumentTool } =
      await importEditDocumentModule();

    const artifactTool = createUltraChatbotAgentEditDocumentTool({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      visitorId: "visitor-1",
    });
    const result = await artifactTool.execute?.(
      {
        documentTitle: "Launch brief",
        newText: "compliance-safe rollout phrasing",
        oldText: "missing sentence",
        replaceAll: false,
      },
      {} as never
    );

    expect(documentStoreState.saveDocument).not.toHaveBeenCalled();
    expect(result).toEqual({
      error: 'Could not find "missing sentence" in "Launch brief".',
    });
  });
});
