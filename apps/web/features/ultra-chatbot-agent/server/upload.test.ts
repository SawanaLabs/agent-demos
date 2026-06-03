import { beforeEach, describe, expect, it, vi } from "vitest";

const blobState = vi.hoisted(() => ({
  list: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  list: blobState.list,
  put: blobState.put,
}));

function importUploadModule() {
  return import("./upload");
}

function createUploadRequest(file: File, fields?: { chatId?: string }) {
  const formData = new FormData();
  formData.append("file", file);

  if (fields?.chatId) {
    formData.append("chatId", fields.chatId);
  }

  return new Request(
    "http://localhost/api/demos/ultra-chatbot-agent/files/upload",
    {
      body: formData,
      method: "POST",
    }
  );
}

describe("ultra chatbot agent upload route", () => {
  beforeEach(() => {
    vi.resetModules();
    blobState.list.mockReset();
    blobState.put.mockReset();
    blobState.list.mockResolvedValue({
      blobs: [],
      hasMore: false,
    });
  });

  it("rejects uploads when the blob token is missing", async () => {
    const { handleUltraChatbotAgentFileUploadRequest } =
      await importUploadModule();
    const response = await handleUltraChatbotAgentFileUploadRequest(
      createUploadRequest(
        new File(["hello"], "hello.png", {
          type: "image/png",
        }),
        { chatId: "chat-1" }
      ),
      { visitorId: "visitor-1" },
      {}
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("BLOB_READ_WRITE_TOKEN"),
    });
  });

  it("rejects unsupported file types", async () => {
    const { handleUltraChatbotAgentFileUploadRequest } =
      await importUploadModule();
    const response = await handleUltraChatbotAgentFileUploadRequest(
      createUploadRequest(
        new File(["hello"], "notes.txt", {
          type: "text/plain",
        }),
        { chatId: "chat-1" }
      ),
      { visitorId: "visitor-1" },
      {
        BLOB_READ_WRITE_TOKEN: "blob-token",
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "File type should be PDF, JPEG, or PNG.",
    });
  });

  it("uploads a validated pdf to vercel blob", async () => {
    blobState.put.mockResolvedValue({
      contentType: "application/pdf",
      pathname: "ultra-chatbot-agent/visitor-1/2026-06-03/chat-1/notes.pdf",
      size: 5,
      url: "https://blob.example/notes.pdf",
    });

    const { handleUltraChatbotAgentFileUploadRequest } =
      await importUploadModule();
    const response = await handleUltraChatbotAgentFileUploadRequest(
      createUploadRequest(
        new File(["hello"], "notes.pdf", {
          type: "application/pdf",
        }),
        { chatId: "chat-1" }
      ),
      { visitorId: "visitor-1" },
      {
        BLOB_READ_WRITE_TOKEN: "blob-token",
      },
      {
        now: new Date("2026-06-03T12:00:00.000Z"),
      }
    );

    expect(response.status).toBe(200);
    expect(blobState.list).toHaveBeenCalledWith({
      limit: 1000,
      prefix: "ultra-chatbot-agent/visitor-1/2026-06-03/",
      token: "blob-token",
    });
    expect(blobState.put).toHaveBeenCalledWith(
      expect.stringMatching(
        /^ultra-chatbot-agent\/visitor-1\/2026-06-03\/chat-1\/.+-notes\.pdf$/
      ),
      expect.any(File),
      {
        access: "public",
        token: "blob-token",
      }
    );
    await expect(response.json()).resolves.toEqual({
      contentType: "application/pdf",
      pathname: "ultra-chatbot-agent/visitor-1/2026-06-03/chat-1/notes.pdf",
      size: 5,
      url: "https://blob.example/notes.pdf",
    });
  });

  it("uploads a validated image to vercel blob", async () => {
    blobState.put.mockResolvedValue({
      contentType: "image/png",
      pathname: "ultra-chatbot-agent/visitor-1/2026-06-03/chat-1/example.png",
      size: 5,
      url: "https://blob.example/example.png",
    });

    const { handleUltraChatbotAgentFileUploadRequest } =
      await importUploadModule();
    const response = await handleUltraChatbotAgentFileUploadRequest(
      createUploadRequest(
        new File(["hello"], "example.png", {
          type: "image/png",
        }),
        { chatId: "chat-1" }
      ),
      { visitorId: "visitor-1" },
      {
        BLOB_READ_WRITE_TOKEN: "blob-token",
      },
      {
        now: new Date("2026-06-03T12:00:00.000Z"),
      }
    );

    expect(response.status).toBe(200);
    expect(blobState.put).toHaveBeenCalledWith(
      expect.stringMatching(
        /^ultra-chatbot-agent\/visitor-1\/2026-06-03\/chat-1\/.+-example\.png$/
      ),
      expect.any(File),
      {
        access: "public",
        token: "blob-token",
      }
    );
    await expect(response.json()).resolves.toEqual({
      contentType: "image/png",
      pathname: "ultra-chatbot-agent/visitor-1/2026-06-03/chat-1/example.png",
      size: 5,
      url: "https://blob.example/example.png",
    });
  });

  it("rejects uploads when the daily visitor blob quota is exceeded", async () => {
    blobState.list.mockResolvedValue({
      blobs: Array.from({ length: 20 }, (_, index) => ({
        downloadUrl: `https://blob.example/file-${index}.png?download=1`,
        etag: `etag-${index}`,
        pathname: `ultra-chatbot-agent/visitor-1/2026-06-03/chat-1/file-${index}.png`,
        size: 1024,
        uploadedAt: new Date("2026-06-03T10:00:00.000Z"),
        url: `https://blob.example/file-${index}.png`,
      })),
      hasMore: false,
    });

    const { handleUltraChatbotAgentFileUploadRequest } =
      await importUploadModule();
    const response = await handleUltraChatbotAgentFileUploadRequest(
      createUploadRequest(
        new File(["hello"], "example.png", {
          type: "image/png",
        }),
        { chatId: "chat-1" }
      ),
      { visitorId: "visitor-1" },
      {
        BLOB_READ_WRITE_TOKEN: "blob-token",
      },
      {
        now: new Date("2026-06-03T12:00:00.000Z"),
      }
    );

    expect(response.status).toBe(429);
    expect(blobState.put).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "Daily upload quota exceeded.",
    });
  });
});
