import { beforeEach, describe, expect, it, vi } from "vitest";

const storeState = vi.hoisted(() => ({
  deleteMessagesAfterMessage: vi.fn(),
  loadChatSession: vi.fn(),
  saveIncomingUserMessage: vi.fn(),
}));

vi.mock("./chat-store", () => ({
  createUltraChatbotAgentChatStore: vi.fn(() => storeState),
}));

function importMessageEditModule() {
  return import("./message-edit");
}

describe("ultra chatbot agent message edit contract", () => {
  beforeEach(() => {
    vi.resetModules();
    storeState.deleteMessagesAfterMessage.mockReset();
    storeState.loadChatSession.mockReset();
    storeState.saveIncomingUserMessage.mockReset();
    storeState.loadChatSession.mockResolvedValue({
      chat: {
        activeStreamId: null,
        capabilities: {
          sandboxEnabled: false,
        },
        createdAt: "2026-05-25T00:00:00.000Z",
        id: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
        selectedChatModel: "openai/gpt-4.1-mini",
        title: "Test",
        updatedAt: "2026-05-25T00:00:00.000Z",
        visibility: "private",
        visitorId: "visitor-1",
      },
      messages: [
        {
          id: "user-1",
          parts: [
            {
              filename: "paper.pdf",
              mediaType: "application/pdf",
              type: "file",
              url: "https://blob.vercel-storage.com/paper.pdf",
            },
            { text: "Old question", type: "text" },
          ],
          role: "user",
        },
        {
          id: "assistant-1",
          parts: [{ text: "Old answer", type: "text" }],
          role: "assistant",
        },
      ],
    });
    storeState.deleteMessagesAfterMessage.mockResolvedValue({
      deletedCount: 1,
    });
    storeState.saveIncomingUserMessage.mockResolvedValue(undefined);
  });

  it("rejects malformed edit payloads", async () => {
    const { handleUltraChatbotAgentMessageEditRequest } =
      await importMessageEditModule();

    const response = await handleUltraChatbotAgentMessageEditRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent/messages", {
        body: JSON.stringify({
          messageId: "",
          text: "",
        }),
        method: "PATCH",
      }),
      {
        chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(400);
    expect(storeState.deleteMessagesAfterMessage).not.toHaveBeenCalled();
  });

  it("rejects edits for missing visitor-owned chats", async () => {
    const { handleUltraChatbotAgentMessageEditRequest } =
      await importMessageEditModule();
    storeState.loadChatSession.mockResolvedValueOnce(null);

    const response = await handleUltraChatbotAgentMessageEditRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent/messages", {
        body: JSON.stringify({
          messageId: "user-1",
          text: "New question",
        }),
        method: "PATCH",
      }),
      {
        chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(404);
    expect(storeState.deleteMessagesAfterMessage).not.toHaveBeenCalled();
  });

  it("trims trailing messages after the edited user turn", async () => {
    const { handleUltraChatbotAgentMessageEditRequest } =
      await importMessageEditModule();

    const response = await handleUltraChatbotAgentMessageEditRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent/messages", {
        body: JSON.stringify({
          messageId: "user-1",
          text: "New question",
        }),
        method: "PATCH",
      }),
      {
        chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(200);
    expect(storeState.saveIncomingUserMessage).toHaveBeenCalledWith({
      chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
      message: expect.objectContaining({
        id: "user-1",
        parts: [
          {
            filename: "paper.pdf",
            mediaType: "application/pdf",
            type: "file",
            url: "https://blob.vercel-storage.com/paper.pdf",
          },
          { text: "New question", type: "text" },
        ],
        role: "user",
      }),
      selectedChatModel: "openai/gpt-4.1-mini",
      selectedVisibilityType: "private",
      visitorId: "visitor-1",
    });
    expect(storeState.deleteMessagesAfterMessage).toHaveBeenCalledWith({
      chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
      messageId: "user-1",
      visitorId: "visitor-1",
    });
  });

  it("removes file attachments omitted from the retained file url list", async () => {
    const { handleUltraChatbotAgentMessageEditRequest } =
      await importMessageEditModule();
    storeState.loadChatSession.mockResolvedValueOnce({
      chat: {
        activeStreamId: null,
        capabilities: {
          sandboxEnabled: false,
        },
        createdAt: "2026-05-25T00:00:00.000Z",
        id: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
        selectedChatModel: "openai/gpt-4.1-mini",
        title: "Test",
        updatedAt: "2026-05-25T00:00:00.000Z",
        visibility: "private",
        visitorId: "visitor-1",
      },
      messages: [
        {
          id: "user-1",
          parts: [
            {
              filename: "paper.pdf",
              mediaType: "application/pdf",
              type: "file",
              url: "https://blob.vercel-storage.com/paper.pdf",
            },
            {
              filename: "mockup.png",
              mediaType: "image/png",
              type: "file",
              url: "https://blob.vercel-storage.com/mockup.png",
            },
            { text: "Old question", type: "text" },
          ],
          role: "user",
        },
      ],
    });

    const response = await handleUltraChatbotAgentMessageEditRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent/messages", {
        body: JSON.stringify({
          messageId: "user-1",
          retainedFileUrls: ["https://blob.vercel-storage.com/mockup.png"],
          text: "New question",
        }),
        method: "PATCH",
      }),
      {
        chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(200);
    expect(storeState.saveIncomingUserMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.objectContaining({
          parts: [
            {
              filename: "mockup.png",
              mediaType: "image/png",
              type: "file",
              url: "https://blob.vercel-storage.com/mockup.png",
            },
            { text: "New question", type: "text" },
          ],
        }),
      })
    );
  });
});
