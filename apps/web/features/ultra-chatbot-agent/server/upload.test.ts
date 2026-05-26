import { beforeEach, describe, expect, it, vi } from "vitest";

const blobState = vi.hoisted(() => ({
  put: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  put: blobState.put,
}));

function importUploadModule() {
  return import("./upload");
}

function createUploadRequest(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return new Request("http://localhost/api/demos/ultra-chatbot-agent/files/upload", {
    body: formData,
    method: "POST",
  });
}

describe("ultra chatbot agent upload route", () => {
  beforeEach(() => {
    vi.resetModules();
    blobState.put.mockReset();
  });

  it("rejects uploads when the blob token is missing", async () => {
    const { handleUltraChatbotAgentFileUploadRequest } = await importUploadModule();
    const response = await handleUltraChatbotAgentFileUploadRequest(
      createUploadRequest(
        new File(["hello"], "hello.png", {
          type: "image/png",
        })
      ),
      {}
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("BLOB_READ_WRITE_TOKEN"),
    });
  });

  it("rejects unsupported file types", async () => {
    const { handleUltraChatbotAgentFileUploadRequest } = await importUploadModule();
    const response = await handleUltraChatbotAgentFileUploadRequest(
      createUploadRequest(
        new File(["hello"], "notes.pdf", {
          type: "application/pdf",
        })
      ),
      {
        BLOB_READ_WRITE_TOKEN: "blob-token",
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "File type should be JPEG or PNG.",
    });
  });

  it("uploads a validated image to vercel blob", async () => {
    blobState.put.mockResolvedValue({
      contentType: "image/png",
      pathname: "ultra-chatbot-agent/example.png",
      size: 5,
      url: "https://blob.example/example.png",
    });

    const { handleUltraChatbotAgentFileUploadRequest } = await importUploadModule();
    const response = await handleUltraChatbotAgentFileUploadRequest(
      createUploadRequest(
        new File(["hello"], "example.png", {
          type: "image/png",
        })
      ),
      {
        BLOB_READ_WRITE_TOKEN: "blob-token",
      }
    );

    expect(response.status).toBe(200);
    expect(blobState.put).toHaveBeenCalledWith(
      expect.stringMatching(/^ultra-chatbot-agent\/.+-example\.png$/),
      expect.any(File),
      {
        access: "public",
        token: "blob-token",
      }
    );
    await expect(response.json()).resolves.toEqual({
      contentType: "image/png",
      pathname: "ultra-chatbot-agent/example.png",
      size: 5,
      url: "https://blob.example/example.png",
    });
  });
});
