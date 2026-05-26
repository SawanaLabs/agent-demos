import { beforeEach, describe, expect, it, vi } from "vitest";

const storeState = vi.hoisted(() => ({
  loadChatSession: vi.fn(),
  setChatVisibility: vi.fn(),
}));

vi.mock("./chat-store", () => ({
  createUltraChatbotAgentChatStore: vi.fn(() => storeState),
}));

function importVisibilityModule() {
  return import("./visibility");
}

describe("ultra chatbot agent visibility route contract", () => {
  beforeEach(() => {
    vi.resetModules();
    storeState.loadChatSession.mockReset();
    storeState.setChatVisibility.mockReset();
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
    storeState.setChatVisibility.mockResolvedValue({
      visibility: "public",
    });
  });

  it("rejects malformed visibility payloads", async () => {
    const { handleUltraChatbotAgentVisibilityPatchRequest } =
      await importVisibilityModule();

    const response = await handleUltraChatbotAgentVisibilityPatchRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent/visibility", {
        body: JSON.stringify({
          visibility: "internal",
        }),
        method: "PATCH",
      }),
      {
        chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(400);
    expect(storeState.setChatVisibility).not.toHaveBeenCalled();
  });

  it("rejects visibility changes for missing visitor-owned chats", async () => {
    const { handleUltraChatbotAgentVisibilityPatchRequest } =
      await importVisibilityModule();
    storeState.loadChatSession.mockResolvedValueOnce(null);

    const response = await handleUltraChatbotAgentVisibilityPatchRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent/visibility", {
        body: JSON.stringify({
          visibility: "public",
        }),
        method: "PATCH",
      }),
      {
        chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(404);
    expect(storeState.setChatVisibility).not.toHaveBeenCalled();
  });

  it("updates visibility for the current visitor-owned chat", async () => {
    const { handleUltraChatbotAgentVisibilityPatchRequest } =
      await importVisibilityModule();

    const response = await handleUltraChatbotAgentVisibilityPatchRequest(
      new Request("http://localhost/api/demos/ultra-chatbot-agent/visibility", {
        body: JSON.stringify({
          visibility: "public",
        }),
        method: "PATCH",
      }),
      {
        chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
        visitorId: "visitor-1",
      }
    );

    expect(response.status).toBe(200);
    expect(storeState.loadChatSession).toHaveBeenCalledWith(
      "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
      "visitor-1"
    );
    expect(storeState.setChatVisibility).toHaveBeenCalledWith({
      chatId: "5bd4e261-60f6-4b0f-b6f4-73e64bb2d5f5",
      visibility: "public",
      visitorId: "visitor-1",
    });
  });
});
