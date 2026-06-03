import { describe, expect, it, vi } from "vitest";

const envState = vi.hoisted(() => ({
  CRON_SECRET: undefined as string | undefined,
}));

vi.mock("@/env", () => ({
  env: envState,
}));

vi.mock("@/features/ultra-chatbot-agent/server/cleanup", () => ({
  cleanupExpiredUltraChatbotAgentDemoData: vi.fn(),
  ultraChatbotAgentCleanupCronScheduleUtc: "0 20 * * *",
}));

import { cleanupExpiredUltraChatbotAgentDemoData } from "@/features/ultra-chatbot-agent/server/cleanup";
import { GET } from "./route";

describe("ultra chatbot agent cleanup cron route", () => {
  it("rejects requests when CRON_SECRET is missing", async () => {
    envState.CRON_SECRET = undefined;

    const response = await GET(
      new Request("http://localhost/api/cron/ultra-chatbot-agent-cleanup")
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
      new Request("http://localhost/api/cron/ultra-chatbot-agent-cleanup", {
        headers: {
          authorization: "Bearer wrong-secret",
        },
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized ultra-chatbot-agent cleanup request.",
    });
  });

  it("returns cleanup results for authenticated requests", async () => {
    envState.CRON_SECRET = "expected-secret";
    vi.mocked(cleanupExpiredUltraChatbotAgentDemoData).mockResolvedValue({
      blobs: {
        deletedCount: 3,
        expiresBefore: "2026-05-27T20:00:00.000Z",
        retentionDays: 7,
      },
      database: {
        chatIds: ["chat-1"],
        deletedChats: 1,
        deletedVotes: 2,
        expiresBefore: "2026-05-27T20:00:00.000Z",
        retentionDays: 7,
      },
      retentionDays: 7,
    });

    const response = await GET(
      new Request("http://localhost/api/cron/ultra-chatbot-agent-cleanup", {
        headers: {
          authorization: "Bearer expected-secret",
        },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      blobs: {
        deletedCount: 3,
        expiresBefore: "2026-05-27T20:00:00.000Z",
        retentionDays: 7,
      },
      database: {
        chatIds: ["chat-1"],
        deletedChats: 1,
        deletedVotes: 2,
        expiresBefore: "2026-05-27T20:00:00.000Z",
        retentionDays: 7,
      },
      retentionDays: 7,
      scheduleUtc: "0 20 * * *",
    });
  });
});
