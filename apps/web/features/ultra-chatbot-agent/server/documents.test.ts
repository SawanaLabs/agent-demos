import { beforeEach, describe, expect, it, vi } from "vitest";

const storeState = vi.hoisted(() => ({
  deleteDocumentVersionsAfterTimestamp: vi.fn(),
  listDocumentVersions: vi.fn(),
  listLatestDocumentsForChat: vi.fn(),
  saveDocument: vi.fn(),
}));

vi.mock("./document-store", () => ({
  createUltraChatbotAgentDocumentStore: vi.fn(() => storeState),
}));

function importDocumentsModule() {
  return import("./documents");
}

describe("ultra chatbot agent document route contract", () => {
  beforeEach(() => {
    vi.resetModules();
    storeState.deleteDocumentVersionsAfterTimestamp.mockReset();
    storeState.listDocumentVersions.mockReset();
    storeState.listLatestDocumentsForChat.mockReset();
    storeState.saveDocument.mockReset();
    storeState.listLatestDocumentsForChat.mockResolvedValue([]);
    storeState.listDocumentVersions.mockResolvedValue([
      {
        content: "Draft",
        createdAt: "2026-05-25T00:00:00.000Z",
        id: "2ae89d54-68d8-4948-afca-1880b9ef2690",
        kind: "text",
        title: "Launch note",
        visitorId: "visitor-1",
      },
    ]);
    storeState.saveDocument.mockResolvedValue({
      content: "Draft",
      createdAt: "2026-05-25T00:01:00.000Z",
      id: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      kind: "text",
      title: "Launch note",
      visitorId: "visitor-1",
    });
    storeState.deleteDocumentVersionsAfterTimestamp.mockResolvedValue({
      deletedCount: 1,
    });
  });

  it("lists latest thread documents when no id is provided", async () => {
    const documentsModule = await importDocumentsModule();

    const response = await documentsModule.handleUltraChatbotAgentDocumentRequest(
      new Request(
        "http://localhost/api/demos/ultra-chatbot-agent/document?chatId=7dad003a-e507-448b-ac02-10937a0290da"
      ),
      {
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(200);
    expect(storeState.listLatestDocumentsForChat).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      limit: 12,
      visitorId: "visitor-1",
    });
  });

  it("requires chatId for document requests", async () => {
    const documentsModule = await importDocumentsModule();

    const response = await documentsModule.handleUltraChatbotAgentDocumentRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent/document"),
      {
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Expected the "chatId" search parameter.',
    });
  });

  it("rejects malformed document create payloads", async () => {
    const documentsModule = await importDocumentsModule();

    const response = await documentsModule.handleUltraChatbotAgentDocumentRequest(
      new Request(
        "http://localhost/api/demos/ultra-chatbot-agent/document?chatId=7dad003a-e507-448b-ac02-10937a0290da&id=2ae89d54-68d8-4948-afca-1880b9ef2690",
        {
          body: JSON.stringify({
            content: 42,
          }),
          method: "POST",
        }
      ),
      {
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(400);
    expect(storeState.saveDocument).not.toHaveBeenCalled();
  });

  it("creates a new document version for the current visitor", async () => {
    const documentsModule = await importDocumentsModule();
    storeState.listDocumentVersions.mockResolvedValueOnce([]);

    const response = await documentsModule.handleUltraChatbotAgentDocumentRequest(
      new Request(
        "http://localhost/api/demos/ultra-chatbot-agent/document?chatId=7dad003a-e507-448b-ac02-10937a0290da&id=2ae89d54-68d8-4948-afca-1880b9ef2690",
        {
          body: JSON.stringify({
            content: "Draft",
            kind: "text",
            title: "Launch note",
          }),
          method: "POST",
        }
      ),
      {
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(200);
    expect(storeState.saveDocument).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      content: "Draft",
      documentId: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      kind: "text",
      title: "Launch note",
      visitorId: "visitor-1",
    });
  });

  it("deletes newer versions after the selected timestamp", async () => {
    const documentsModule = await importDocumentsModule();

    const response = await documentsModule.handleUltraChatbotAgentDocumentRequest(
      new Request(
        "http://localhost/api/demos/ultra-chatbot-agent/document?chatId=7dad003a-e507-448b-ac02-10937a0290da&id=2ae89d54-68d8-4948-afca-1880b9ef2690&timestamp=2026-05-25T00:00:00.000Z",
        {
          method: "DELETE",
        }
      ),
      {
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(200);
    expect(
      storeState.deleteDocumentVersionsAfterTimestamp
    ).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      documentId: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      timestamp: new Date("2026-05-25T00:00:00.000Z"),
      visitorId: "visitor-1",
    });
  });
});
