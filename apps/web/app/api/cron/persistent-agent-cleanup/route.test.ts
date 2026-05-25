import { describe, expect, it, vi } from "vitest";

const envState = vi.hoisted(() => ({
  CRON_SECRET: undefined as string | undefined,
}));

vi.mock("@/env", () => ({
  env: envState,
}));

vi.mock("@/features/persistent-agent/server/cleanup", () => ({
  cleanupExpiredPersistentAgentChats: vi.fn(),
  persistentAgentCleanupCronScheduleUtc: "0 20 * * *",
}));

import { cleanupExpiredPersistentAgentChats } from "@/features/persistent-agent/server/cleanup";
import { GET } from "./route";

describe("persistent agent cleanup cron route", () => {
  it("rejects requests when CRON_SECRET is missing", async () => {
    envState.CRON_SECRET = undefined;

    const response = await GET(
      new Request("http://localhost/api/cron/persistent-agent-cleanup")
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error:
        "CRON_SECRET is missing. Customer-memory cleanup cron requires an authenticated secret.",
    });
  });

  it("rejects unauthorized requests", async () => {
    envState.CRON_SECRET = "expected-secret";

    const response = await GET(
      new Request("http://localhost/api/cron/persistent-agent-cleanup", {
        headers: {
          authorization: "Bearer wrong-secret",
        },
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized persistent-agent cleanup request.",
    });
  });

  it("returns cleanup results for authenticated requests", async () => {
    envState.CRON_SECRET = "expected-secret";
    vi.mocked(cleanupExpiredPersistentAgentChats).mockResolvedValue({
      deletedChats: 2,
      expiresBefore: "2026-05-22T20:00:00.000Z",
    });

    const response = await GET(
      new Request("http://localhost/api/cron/persistent-agent-cleanup", {
        headers: {
          authorization: "Bearer expected-secret",
        },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      deletedChats: 2,
      expiresBefore: "2026-05-22T20:00:00.000Z",
      scheduleUtc: "0 20 * * *",
    });
  });
});
