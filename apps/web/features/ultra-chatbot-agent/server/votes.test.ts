import { beforeEach, describe, expect, it, vi } from "vitest";

const storeState = vi.hoisted(() => ({
  listVotesForChat: vi.fn(),
  loadChatSession: vi.fn(),
  saveVote: vi.fn(),
}));

vi.mock("./chat-store", () => ({
  createUltraChatbotAgentChatStore: vi.fn(() => storeState),
}));

function importVotesModule() {
  return import("./votes");
}

describe("ultra chatbot agent vote route contract", () => {
  beforeEach(() => {
    vi.resetModules();
    storeState.listVotesForChat.mockReset();
    storeState.loadChatSession.mockReset();
    storeState.saveVote.mockReset();
    storeState.listVotesForChat.mockResolvedValue([]);
    storeState.loadChatSession.mockResolvedValue({
      chat: {
        activeStreamId: null,
        createdAt: "2026-05-25T00:00:00.000Z",
        id: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
        selectedChatModel: "openai/gpt-4.1-mini",
        title: "Test",
        updatedAt: "2026-05-25T00:00:00.000Z",
        visibility: "private",
        visitorId: "visitor-1",
      },
      messages: [],
    });
    storeState.saveVote.mockResolvedValue(undefined);
  });

  it("requires chatId to list votes", async () => {
    const { handleUltraChatbotAgentVoteListRequest } =
      await importVotesModule();

    const response = await handleUltraChatbotAgentVoteListRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent/vote"),
      {
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(400);
    expect(storeState.loadChatSession).not.toHaveBeenCalled();
  });

  it("loads votes only for a visitor-owned chat", async () => {
    const { handleUltraChatbotAgentVoteListRequest } =
      await importVotesModule();

    const response = await handleUltraChatbotAgentVoteListRequest(
      new Request(
        "http://localhost/api/demos/ultra-chatbot-agent/vote?chatId=5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5"
      ),
      {
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(200);
    expect(storeState.loadChatSession).toHaveBeenCalledWith(
      "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
      "visitor-1"
    );
    expect(storeState.listVotesForChat).toHaveBeenCalledWith({
      chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
      visitorId: "visitor-1",
    });
  });

  it("rejects malformed vote payloads", async () => {
    const { handleUltraChatbotAgentVotePatchRequest } =
      await importVotesModule();

    const response = await handleUltraChatbotAgentVotePatchRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent/vote", {
        body: JSON.stringify({
          chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
          messageId: "assistant-1",
          type: "sideways",
        }),
        method: "PATCH",
      }),
      {
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(400);
    expect(storeState.saveVote).not.toHaveBeenCalled();
  });

  it("persists visitor-owned message votes", async () => {
    const { handleUltraChatbotAgentVotePatchRequest } =
      await importVotesModule();

    const response = await handleUltraChatbotAgentVotePatchRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent/vote", {
        body: JSON.stringify({
          chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
          messageId: "assistant-1",
          type: "down",
        }),
        method: "PATCH",
      }),
      {
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(200);
    expect(storeState.saveVote).toHaveBeenCalledWith({
      chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
      isUpvoted: false,
      messageId: "assistant-1",
      visitorId: "visitor-1",
    });
  });
});
