import { beforeEach, describe, expect, it, vi } from "vitest";

const storeState = vi.hoisted(() => ({
  deleteAllChatsForVisitor: vi.fn(),
  deleteChatForVisitor: vi.fn(),
  listChatsForVisitorPage: vi.fn(),
}));

vi.mock("./chat-store", () => ({
  createUltraChatbotAgentChatStore: vi.fn(() => storeState),
}));

function importHistoryModule() {
  return import("./history");
}

describe("ultra chatbot agent history route contract", () => {
  beforeEach(() => {
    vi.resetModules();
    storeState.deleteAllChatsForVisitor.mockReset();
    storeState.deleteChatForVisitor.mockReset();
    storeState.listChatsForVisitorPage.mockReset();
    storeState.listChatsForVisitorPage.mockResolvedValue({
      chats: [],
      hasMore: false,
    });
    storeState.deleteAllChatsForVisitor.mockResolvedValue({
      deletedCount: 0,
    });
    storeState.deleteChatForVisitor.mockResolvedValue({
      deletedCount: 1,
    });
  });

  it("rejects using both pagination cursors at the same time", async () => {
    const { handleUltraChatbotAgentHistoryRequest } = await importHistoryModule();

    const response = await handleUltraChatbotAgentHistoryRequest(
      new Request(
        "http://localhost/api/demos/ultra-chatbot-agent/history?starting_after=a&ending_before=b"
      ),
      {
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(400);
    expect(storeState.listChatsForVisitorPage).not.toHaveBeenCalled();
  });

  it("clamps the requested page size before loading visitor history", async () => {
    const { handleUltraChatbotAgentHistoryRequest } = await importHistoryModule();

    await handleUltraChatbotAgentHistoryRequest(
      new Request(
        "http://localhost/api/demos/ultra-chatbot-agent/history?limit=999"
      ),
      {
        visitorId: "visitor-1",
      }
    );

    expect(storeState.listChatsForVisitorPage).toHaveBeenCalledWith({
      endingBefore: null,
      limit: 50,
      startingAfter: null,
      visitorId: "visitor-1",
    });
  });

  it("deletes all chats for the current visitor", async () => {
    const { handleUltraChatbotAgentDeleteHistoryRequest } =
      await importHistoryModule();

    const response = await handleUltraChatbotAgentDeleteHistoryRequest({
      visitorId: "visitor-1",
    });

    expect(response.status).toBe(200);
    expect(storeState.deleteAllChatsForVisitor).toHaveBeenCalledWith({
      visitorId: "visitor-1",
    });
  });

  it("deletes one chat for the current visitor", async () => {
    const { handleUltraChatbotAgentDeleteChatRequest } =
      await importHistoryModule();

    const response = await handleUltraChatbotAgentDeleteChatRequest("chat-1", {
      visitorId: "visitor-1",
    });

    expect(response.status).toBe(200);
    expect(storeState.deleteChatForVisitor).toHaveBeenCalledWith({
      chatId: "chat-1",
      visitorId: "visitor-1",
    });
  });

  it("rejects empty chat ids for per-chat deletion", async () => {
    const { handleUltraChatbotAgentDeleteChatRequest } =
      await importHistoryModule();

    const response = await handleUltraChatbotAgentDeleteChatRequest(" ", {
      visitorId: "visitor-1",
    });

    expect(response.status).toBe(400);
    expect(storeState.deleteChatForVisitor).not.toHaveBeenCalled();
  });

  it("returns not found when deleting a missing chat", async () => {
    storeState.deleteChatForVisitor.mockResolvedValue({
      deletedCount: 0,
    });
    const { handleUltraChatbotAgentDeleteChatRequest } =
      await importHistoryModule();

    const response = await handleUltraChatbotAgentDeleteChatRequest("chat-1", {
      visitorId: "visitor-1",
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Chat not found.",
    });
  });
});
