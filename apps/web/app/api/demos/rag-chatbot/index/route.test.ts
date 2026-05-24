import { afterEach, describe, expect, it, vi } from "vitest";

const { indexRagChatbotSourceMock } = vi.hoisted(() => ({
  indexRagChatbotSourceMock: vi.fn(),
}));

vi.mock("@/features/rag-chatbot/server/index-source", () => ({
  indexRagChatbotSource: indexRagChatbotSourceMock,
}));

import { POST } from "./route";

const originalEnv = { ...process.env };
const productionDisabledPattern = /disabled in production/i;
const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY/i;
const missingDatabaseUrlPattern = /DATABASE_URL/i;

describe("rag chatbot index route", () => {
  afterEach(() => {
    indexRagChatbotSourceMock.mockReset();
    process.env = { ...originalEnv };
  });

  it("blocks indexing in production", async () => {
    process.env = { ...process.env, NODE_ENV: "production" };

    const response = await POST(new Request("http://localhost/api/index"));

    expect(response.status).toBe(403);
    expect(indexRagChatbotSourceMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(productionDisabledPattern),
    });
  });

  it("requires the AI Gateway key before indexing", async () => {
    process.env = {
      ...process.env,
      DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      NODE_ENV: "development",
    };
    delete process.env.AI_GATEWAY_API_KEY;

    const response = await POST(new Request("http://localhost/api/index"));

    expect(response.status).toBe(500);
    expect(indexRagChatbotSourceMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingGatewayKeyPattern),
    });
  });

  it("requires the database URL before indexing", async () => {
    process.env = {
      ...process.env,
      AI_GATEWAY_API_KEY: "test-key",
      NODE_ENV: "development",
    };
    delete process.env.DATABASE_URL;

    const response = await POST(new Request("http://localhost/api/index"));

    expect(response.status).toBe(500);
    expect(indexRagChatbotSourceMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingDatabaseUrlPattern),
    });
  });

  it("returns the indexing result when setup is complete", async () => {
    process.env = {
      ...process.env,
      AI_GATEWAY_API_KEY: "test-key",
      DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      NODE_ENV: "development",
    };
    indexRagChatbotSourceMock.mockResolvedValue({
      chunkCount: 183,
      sourceSlug: "nasa-graphics-standards-manual",
      status: "indexed",
    });

    const response = await POST(new Request("http://localhost/api/index"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      chunkCount: 183,
      sourceSlug: "nasa-graphics-standards-manual",
      status: "indexed",
    });
  });

  it("surfaces indexing failures as 500 responses", async () => {
    process.env = {
      ...process.env,
      AI_GATEWAY_API_KEY: "test-key",
      DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      NODE_ENV: "development",
    };
    indexRagChatbotSourceMock.mockRejectedValue(new Error("index failed"));

    const response = await POST(new Request("http://localhost/api/index"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "index failed",
    });
  });
});
