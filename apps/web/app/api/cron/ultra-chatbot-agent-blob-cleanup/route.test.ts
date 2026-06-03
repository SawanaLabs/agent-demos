import { describe, expect, it, vi } from "vitest";

const envState = vi.hoisted(() => ({
  CRON_SECRET: undefined as string | undefined,
}));

vi.mock("@/env", () => ({
  env: envState,
}));

vi.mock("@/features/ultra-chatbot-agent/server/blob-cleanup", () => ({
  cleanupExpiredUltraChatbotAgentUploadBlobs: vi.fn(),
  ultraChatbotAgentBlobCleanupCronScheduleUtc: "0 20 * * *",
}));

import { cleanupExpiredUltraChatbotAgentUploadBlobs } from "@/features/ultra-chatbot-agent/server/blob-cleanup";
import { GET } from "./route";

describe("ultra chatbot agent blob cleanup cron route", () => {
  it("rejects requests when CRON_SECRET is missing", async () => {
    envState.CRON_SECRET = undefined;

    const response = await GET(
      new Request("http://localhost/api/cron/ultra-chatbot-agent-blob-cleanup")
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error:
        "CRON_SECRET is missing. Cleanup cron routes require an authenticated secret.",
    });
  });

  it("rejects unauthorized requests", async () => {
    envState.CRON_SECRET = "expected-secret";

    const response = await GET(
      new Request(
        "http://localhost/api/cron/ultra-chatbot-agent-blob-cleanup",
        {
          headers: {
            authorization: "Bearer wrong-secret",
          },
        }
      )
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized ultra-chatbot-agent blob cleanup request.",
    });
  });

  it("returns cleanup results for authenticated requests", async () => {
    envState.CRON_SECRET = "expected-secret";
    vi.mocked(cleanupExpiredUltraChatbotAgentUploadBlobs).mockResolvedValue({
      deletedCount: 2,
      expiresBefore: "2026-05-27T20:00:00.000Z",
      retentionDays: 7,
    });

    const response = await GET(
      new Request(
        "http://localhost/api/cron/ultra-chatbot-agent-blob-cleanup",
        {
          headers: {
            authorization: "Bearer expected-secret",
          },
        }
      )
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      deletedCount: 2,
      expiresBefore: "2026-05-27T20:00:00.000Z",
      retentionDays: 7,
      scheduleUtc: "0 20 * * *",
    });
  });
});
