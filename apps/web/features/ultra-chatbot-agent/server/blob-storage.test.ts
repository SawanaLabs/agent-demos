import { beforeEach, describe, expect, it, vi } from "vitest";

const blobState = vi.hoisted(() => ({
  del: vi.fn(),
  list: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  del: blobState.del,
  list: blobState.list,
}));

function importBlobStorageModule() {
  return import("./blob-storage");
}

describe("ultra chatbot agent blob storage", () => {
  beforeEach(() => {
    vi.resetModules();
    blobState.del.mockReset();
    blobState.list.mockReset();
  });

  it("deletes only blobs owned by the selected visitor chat", async () => {
    blobState.list.mockResolvedValue({
      blobs: [
        {
          downloadUrl: "https://blob.example/a.pdf?download=1",
          etag: "etag-a",
          pathname: "ultra-chatbot-agent/visitor-1/2026-06-03/chat-1/a.pdf",
          size: 100,
          uploadedAt: new Date("2026-06-03T12:00:00.000Z"),
          url: "https://blob.example/a.pdf",
        },
        {
          downloadUrl: "https://blob.example/b.pdf?download=1",
          etag: "etag-b",
          pathname: "ultra-chatbot-agent/visitor-1/2026-06-03/chat-2/b.pdf",
          size: 100,
          uploadedAt: new Date("2026-06-03T12:00:00.000Z"),
          url: "https://blob.example/b.pdf",
        },
        {
          downloadUrl: "https://blob.example/c.pdf?download=1",
          etag: "etag-c",
          pathname: "ultra-chatbot-agent/visitor-2/2026-06-03/chat-1/c.pdf",
          size: 100,
          uploadedAt: new Date("2026-06-03T12:00:00.000Z"),
          url: "https://blob.example/c.pdf",
        },
      ],
      hasMore: false,
    });

    const { deleteUltraChatbotAgentBlobsForChat } =
      await importBlobStorageModule();
    const result = await deleteUltraChatbotAgentBlobsForChat({
      chatId: "chat-1",
      token: "blob-token",
      visitorId: "visitor-1",
    });

    expect(blobState.list).toHaveBeenCalledWith({
      limit: 1000,
      prefix: "ultra-chatbot-agent/visitor-1/",
      token: "blob-token",
    });
    expect(blobState.del).toHaveBeenCalledWith(
      ["ultra-chatbot-agent/visitor-1/2026-06-03/chat-1/a.pdf"],
      { token: "blob-token" }
    );
    expect(result).toEqual({
      deletedCount: 1,
    });
  });

  it("deletes expired ultra blobs by uploaded time", async () => {
    blobState.list.mockResolvedValue({
      blobs: [
        {
          downloadUrl: "https://blob.example/old.pdf?download=1",
          etag: "etag-old",
          pathname: "ultra-chatbot-agent/visitor-1/2026-05-25/chat-1/old.pdf",
          size: 100,
          uploadedAt: new Date("2026-05-25T12:00:00.000Z"),
          url: "https://blob.example/old.pdf",
        },
        {
          downloadUrl: "https://blob.example/new.pdf?download=1",
          etag: "etag-new",
          pathname: "ultra-chatbot-agent/visitor-1/2026-06-02/chat-1/new.pdf",
          size: 100,
          uploadedAt: new Date("2026-06-02T12:00:00.000Z"),
          url: "https://blob.example/new.pdf",
        },
      ],
      hasMore: false,
    });

    const { cleanupExpiredUltraChatbotAgentBlobs } =
      await importBlobStorageModule();
    const result = await cleanupExpiredUltraChatbotAgentBlobs({
      now: new Date("2026-06-03T20:00:00.000Z"),
      retentionDays: 7,
      token: "blob-token",
    });

    expect(blobState.list).toHaveBeenCalledWith({
      limit: 1000,
      prefix: "ultra-chatbot-agent/",
      token: "blob-token",
    });
    expect(blobState.del).toHaveBeenCalledWith(
      ["ultra-chatbot-agent/visitor-1/2026-05-25/chat-1/old.pdf"],
      { token: "blob-token" }
    );
    expect(result).toEqual({
      deletedCount: 1,
      expiresBefore: "2026-05-27T20:00:00.000Z",
      retentionDays: 7,
    });
  });

  it("deletes every ultra blob owned by a visitor", async () => {
    blobState.list.mockResolvedValue({
      blobs: [
        {
          downloadUrl: "https://blob.example/a.pdf?download=1",
          etag: "etag-a",
          pathname: "ultra-chatbot-agent/visitor-1/2026-06-03/chat-1/a.pdf",
          size: 100,
          uploadedAt: new Date("2026-06-03T12:00:00.000Z"),
          url: "https://blob.example/a.pdf",
        },
        {
          downloadUrl: "https://blob.example/b.pdf?download=1",
          etag: "etag-b",
          pathname: "ultra-chatbot-agent/visitor-1/2026-06-03/chat-2/b.pdf",
          size: 100,
          uploadedAt: new Date("2026-06-03T12:00:00.000Z"),
          url: "https://blob.example/b.pdf",
        },
      ],
      hasMore: false,
    });

    const { deleteUltraChatbotAgentBlobsForVisitor } =
      await importBlobStorageModule();
    const result = await deleteUltraChatbotAgentBlobsForVisitor({
      token: "blob-token",
      visitorId: "visitor-1",
    });

    expect(blobState.del).toHaveBeenCalledWith(
      [
        "ultra-chatbot-agent/visitor-1/2026-06-03/chat-1/a.pdf",
        "ultra-chatbot-agent/visitor-1/2026-06-03/chat-2/b.pdf",
      ],
      { token: "blob-token" }
    );
    expect(result).toEqual({
      deletedCount: 2,
    });
  });
});
