import { afterEach, describe, expect, it, vi } from "vitest";

const { cleanupExpiredCustomerMemoryThreadsMock } = vi.hoisted(() => ({
  cleanupExpiredCustomerMemoryThreadsMock: vi.fn(),
}));

vi.mock("@/features/customer-memory-agent/server/cleanup", () => ({
  cleanupExpiredCustomerMemoryThreads: cleanupExpiredCustomerMemoryThreadsMock,
  customerMemoryCleanupCronScheduleUtc: "0 20 * * *",
  customerMemoryCleanupRetentionDays: 3,
}));

import { GET } from "./route";

const originalEnv = { ...process.env };

describe("customer memory cleanup cron route", () => {
  afterEach(() => {
    cleanupExpiredCustomerMemoryThreadsMock.mockReset();
    process.env = { ...originalEnv };
  });

  it("rejects requests when CRON_SECRET is missing", async () => {
    process.env = { ...process.env };
    delete process.env.CRON_SECRET;

    const response = await GET(
      new Request("http://localhost/api/cron/customer-memory-agent-cleanup")
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error:
        "CRON_SECRET is missing. Customer-memory cleanup cron requires an authenticated secret.",
    });
  });

  it("rejects requests with the wrong bearer token", async () => {
    process.env = { ...process.env, CRON_SECRET: "expected-secret" };

    const response = await GET(
      new Request("http://localhost/api/cron/customer-memory-agent-cleanup", {
        headers: {
          authorization: "Bearer wrong-secret",
        },
      })
    );

    expect(response.status).toBe(401);
    expect(cleanupExpiredCustomerMemoryThreadsMock).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized customer-memory cleanup request.",
    });
  });

  it("returns the cleanup result for authenticated cron requests", async () => {
    process.env = { ...process.env, CRON_SECRET: "expected-secret" };
    cleanupExpiredCustomerMemoryThreadsMock.mockResolvedValue({
      compactionsDeleted: 1,
      cutoff: "2026-05-20T20:00:00.000Z",
      memoriesDeleted: 2,
      messagesDeleted: 4,
      retentionDays: 3,
      threadIds: ["thread-1"],
      threadsDeleted: 1,
    });

    const response = await GET(
      new Request("http://localhost/api/cron/customer-memory-agent-cleanup", {
        headers: {
          authorization: "Bearer expected-secret",
        },
      })
    );

    expect(response.status).toBe(200);
    expect(cleanupExpiredCustomerMemoryThreadsMock).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toEqual({
      compactionsDeleted: 1,
      cutoff: "2026-05-20T20:00:00.000Z",
      memoriesDeleted: 2,
      messagesDeleted: 4,
      retentionDays: 3,
      scheduleUtc: "0 20 * * *",
      threadIds: ["thread-1"],
      threadsDeleted: 1,
    });
  });

  it("surfaces cleanup failures as 500 responses", async () => {
    process.env = { ...process.env, CRON_SECRET: "expected-secret" };
    cleanupExpiredCustomerMemoryThreadsMock.mockRejectedValue(
      new Error("cleanup failed")
    );

    const response = await GET(
      new Request("http://localhost/api/cron/customer-memory-agent-cleanup", {
        headers: {
          authorization: "Bearer expected-secret",
        },
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "cleanup failed",
    });
  });
});
