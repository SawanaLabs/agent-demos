import { beforeEach, describe, expect, it, vi } from "vitest";

const storeState = vi.hoisted(() => ({
  saveDocument: vi.fn(),
}));

vi.mock("./document-store", () => ({
  createUltraChatbotAgentDocumentStore: vi.fn(() => storeState),
}));

function importCreateDocumentModule() {
  return import("./create-document");
}

describe("ultra chatbot agent create document tool", () => {
  beforeEach(() => {
    vi.resetModules();
    storeState.saveDocument.mockReset();
    storeState.saveDocument.mockResolvedValue({
      content: "Draft launch brief",
      createdAt: "2026-05-25T00:00:00.000Z",
      id: "2ae89d54-68d8-4948-afca-1880b9ef2690",
      kind: "text",
      title: "Launch brief",
      visitorId: "visitor-1",
    });
  });

  it("persists a visitor-owned document and returns artifact metadata", async () => {
    const { createUltraChatbotAgentCreateDocumentTool } =
      await importCreateDocumentModule();

    const artifactTool = createUltraChatbotAgentCreateDocumentTool({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      visitorId: "visitor-1",
    });
    const result = await artifactTool.execute?.({
        content: "Draft launch brief",
        kind: "text",
        title: "Launch brief",
      },
      {} as never
    );

    expect(storeState.saveDocument).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      content: "Draft launch brief",
      documentId: expect.any(String),
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
});
