import type { UIMessage } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

const persistentAgentMessageIdPattern = /^pa-msg/;

const aiMockState = vi.hoisted(() => ({
  responseOptions: null as null | {
    consumeSseStream?: (input: { stream: ReadableStream }) => Promise<void>;
    generateMessageId?: () => string;
    onFinish?: (input: {
      isAborted: boolean;
      messages: UIMessage[];
    }) => Promise<void>;
    originalMessages?: UIMessage[];
  },
  streamText: vi.fn(),
}));

const resumableStreamFactoryState = vi.hoisted(() => ({
  createResumableStreamContext: vi.fn(),
}));

const redisState = vi.hoisted(() => ({
  Redis: vi.fn(),
}));

const resumableStreamState = vi.hoisted(() => ({
  createNewResumableStream: vi.fn(),
  resumeExistingStream: vi.fn(),
}));

const storeState = vi.hoisted(() => ({
  cleanupExpiredChats: vi.fn(),
  listChatsForVisitor: vi.fn(),
  loadChatSession: vi.fn(),
  saveFinishedMessages: vi.fn(),
  saveIncomingUserMessage: vi.fn(),
  setActiveStream: vi.fn(),
}));

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");

  return {
    ...actual,
    streamText: aiMockState.streamText,
  };
});

vi.mock("resumable-stream/ioredis", () => ({
  createResumableStreamContext:
    resumableStreamFactoryState.createResumableStreamContext,
}));

vi.mock("ioredis", () => ({
  default: redisState.Redis,
}));

vi.mock("./chat-store", () => ({
  createPersistentAgentChatStore: vi.fn(() => storeState),
  getPersistentAgentChatNotFoundError: (chatId: string) =>
    `No persistent-agent chat found for ${chatId}.`,
  persistentAgentCleanupCronScheduleUtc: "0 20 * * *",
  persistentAgentCleanupRetentionDays: 3,
}));

function importRuntimeModule() {
  return import("./runtime");
}

function createUserMessage(): UIMessage {
  return {
    id: "user-1",
    parts: [
      {
        text: "Explain how route-backed chat persistence works.",
        type: "text",
      },
    ],
    role: "user",
  };
}

describe("persistent agent runtime", () => {
  beforeEach(() => {
    vi.resetModules();
    aiMockState.responseOptions = null;
    aiMockState.streamText.mockReset();
    resumableStreamFactoryState.createResumableStreamContext.mockReset();
    redisState.Redis.mockReset();
    resumableStreamState.createNewResumableStream.mockReset();
    resumableStreamState.resumeExistingStream.mockReset();
    storeState.cleanupExpiredChats.mockReset();
    storeState.listChatsForVisitor.mockReset();
    storeState.loadChatSession.mockReset();
    storeState.saveFinishedMessages.mockReset();
    storeState.saveIncomingUserMessage.mockReset();
    storeState.setActiveStream.mockReset();

    aiMockState.streamText.mockReturnValue({
      toUIMessageStreamResponse(options: typeof aiMockState.responseOptions) {
        aiMockState.responseOptions = options;
        return Response.json({ ok: true });
      },
    });
    storeState.loadChatSession.mockResolvedValue(null);
    storeState.saveIncomingUserMessage.mockResolvedValue(undefined);
    storeState.saveFinishedMessages.mockResolvedValue(undefined);
    storeState.setActiveStream.mockResolvedValue(undefined);
    redisState.Redis.mockImplementation(function MockRedis() {
      return {};
    });
    resumableStreamFactoryState.createResumableStreamContext.mockReturnValue(
      resumableStreamState
    );
  });

  it("reports setup requirements when gateway, database, or redis config is missing", async () => {
    const { getPersistentAgentRuntimeState } = await importRuntimeModule();

    expect(getPersistentAgentRuntimeState({})).toMatchObject({
      cleanupRetentionDays: 3,
      cleanupScheduleUtc: "0 20 * * *",
      isChatAvailable: false,
      resumeRequiresRedis: true,
      setupMessage: expect.stringContaining("AI_GATEWAY_API_KEY"),
      statusLabel: "Setup required",
    });
  });

  it("validates malformed json before touching persistence", async () => {
    const { handlePersistentAgentChatRequest } = await importRuntimeModule();

    const response = await handlePersistentAgentChatRequest(
      new Request("http://localhost/api/demos/persistent-agent", {
        body: '{"id":',
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }),
      {
        visitorId: "visitor-123",
      },
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        REDIS_URL: "redis://localhost:6379",
      }
    );

    expect(response.status).toBe(400);
    expect(storeState.saveIncomingUserMessage).not.toHaveBeenCalled();
  });

  it("persists route-backed chat turns and exposes server-side message id generation", async () => {
    const { handlePersistentAgentChatRequest } = await importRuntimeModule();
    const userMessage = createUserMessage();

    const response = await handlePersistentAgentChatRequest(
      new Request("http://localhost/api/demos/persistent-agent", {
        body: JSON.stringify({
          id: "7dad003a-e507-448b-ac02-10937a0290da",
          message: userMessage,
        }),
        method: "POST",
      }),
      {
        visitorId: "visitor-123",
      },
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        REDIS_URL: "redis://localhost:6379",
      }
    );

    expect(response.status).toBe(200);
    expect(storeState.saveIncomingUserMessage).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      message: userMessage,
      visitorId: "visitor-123",
    });
    expect(aiMockState.responseOptions?.originalMessages).toEqual([
      userMessage,
    ]);
    expect(aiMockState.responseOptions?.generateMessageId).toEqual(
      expect.any(Function)
    );
    expect(aiMockState.responseOptions?.generateMessageId?.()).toMatch(
      persistentAgentMessageIdPattern
    );

    await aiMockState.responseOptions?.consumeSseStream?.({
      stream: new ReadableStream(),
    });

    expect(resumableStreamState.createNewResumableStream).toHaveBeenCalledTimes(
      1
    );
    expect(storeState.setActiveStream).toHaveBeenCalledWith({
      activeStreamId: expect.any(String),
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      visitorId: "visitor-123",
    });

    await aiMockState.responseOptions?.onFinish?.({
      isAborted: false,
      messages: [
        userMessage,
        {
          id: "assistant-1",
          parts: [{ text: "The URL becomes the chat identity.", type: "text" }],
          role: "assistant",
        },
      ],
    });

    expect(storeState.saveFinishedMessages).toHaveBeenCalledWith({
      chatId: "7dad003a-e507-448b-ac02-10937a0290da",
      messages: expect.arrayContaining([
        expect.objectContaining({ id: "assistant-1", role: "assistant" }),
      ]),
      visitorId: "visitor-123",
    });
  });

  it("reuses a module-level resumable stream context across chat turns", async () => {
    const { handlePersistentAgentChatRequest } = await importRuntimeModule();
    const userMessage = createUserMessage();

    const createRequest = () =>
      new Request("http://localhost/api/demos/persistent-agent", {
        body: JSON.stringify({
          id: "7dad003a-e507-448b-ac02-10937a0290da",
          message: userMessage,
        }),
        method: "POST",
      });

    await handlePersistentAgentChatRequest(
      createRequest(),
      {
        visitorId: "visitor-123",
      },
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        REDIS_URL: "redis://localhost:6379",
      }
    );

    const firstResponseOptions = aiMockState.responseOptions;
    await firstResponseOptions?.consumeSseStream?.({
      stream: new ReadableStream(),
    });

    await handlePersistentAgentChatRequest(
      createRequest(),
      {
        visitorId: "visitor-123",
      },
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        REDIS_URL: "redis://localhost:6379",
      }
    );

    const secondResponseOptions = aiMockState.responseOptions;
    await secondResponseOptions?.consumeSseStream?.({
      stream: new ReadableStream(),
    });

    expect(
      resumableStreamFactoryState.createResumableStreamContext
    ).toHaveBeenCalledTimes(1);
    expect(redisState.Redis).toHaveBeenCalledTimes(2);
    expect(redisState.Redis).toHaveBeenNthCalledWith(
      1,
      "redis://localhost:6379",
      {
        enableReadyCheck: false,
      }
    );
    expect(redisState.Redis).toHaveBeenNthCalledWith(
      2,
      "redis://localhost:6379",
      {
        enableReadyCheck: false,
      }
    );
  });

  it("returns 204 when no active resumable stream exists", async () => {
    const { handlePersistentAgentStreamResumeRequest } =
      await importRuntimeModule();
    storeState.loadChatSession.mockResolvedValue({
      chat: {
        activeStreamId: null,
        createdAt: "2026-05-25T00:00:00.000Z",
        id: "chat-1",
        title: "Resume test",
        updatedAt: "2026-05-25T00:00:00.000Z",
        visitorId: "visitor-123",
      },
      messages: [],
    });

    const response = await handlePersistentAgentStreamResumeRequest("chat-1", {
      visitorId: "visitor-123",
    });

    expect(response.status).toBe(204);
  });

  it("returns the persisted session snapshot for resume recovery", async () => {
    const { handlePersistentAgentSessionRequest } = await importRuntimeModule();
    storeState.loadChatSession.mockResolvedValue({
      chat: {
        activeStreamId: null,
        createdAt: "2026-05-25T00:00:00.000Z",
        id: "chat-1",
        title: "Resume test",
        updatedAt: "2026-05-25T00:00:00.000Z",
        visitorId: "visitor-123",
      },
      messages: [createUserMessage()],
    });

    const response = await handlePersistentAgentSessionRequest("chat-1", {
      visitorId: "visitor-123",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      chat: {
        id: "chat-1",
      },
      messages: [
        expect.objectContaining({
          id: "user-1",
          role: "user",
        }),
      ],
    });
  });
});
