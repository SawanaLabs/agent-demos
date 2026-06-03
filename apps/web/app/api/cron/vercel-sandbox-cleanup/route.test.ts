import { describe, expect, it, vi } from "vitest";

const envState = vi.hoisted(() => ({
  CRON_SECRET: undefined as string | undefined,
}));

vi.mock("@/env", () => ({
  env: envState,
}));

vi.mock("@/features/shared/vercel-sandbox/server/cleanup", () => ({
  cleanupExpiredVercelSandboxIdentities: vi.fn(),
  vercelSandboxCleanupCronScheduleUtc: "0 21 * * *",
}));

import { cleanupExpiredVercelSandboxIdentities } from "@/features/shared/vercel-sandbox/server/cleanup";
import { GET } from "./route";

describe("vercel sandbox cleanup cron route", () => {
  it("rejects requests when CRON_SECRET is missing", async () => {
    envState.CRON_SECRET = undefined;

    const response = await GET(
      new Request("http://localhost/api/cron/vercel-sandbox-cleanup")
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
      new Request("http://localhost/api/cron/vercel-sandbox-cleanup", {
        headers: {
          authorization: "Bearer wrong-secret",
        },
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized vercel-sandbox cleanup request.",
    });
  });

  it("returns cleanup results for authenticated requests", async () => {
    envState.CRON_SECRET = "expected-secret";
    vi.mocked(cleanupExpiredVercelSandboxIdentities).mockResolvedValue({
      deletedCount: 2,
      deletedSandboxNames: ["sandbox-a", "sandbox-b"],
      expiresBefore: "2026-05-27T12:00:00.000Z",
      inspectedCount: 3,
      retentionDays: 7,
      skippedCount: 1,
    });

    const response = await GET(
      new Request("http://localhost/api/cron/vercel-sandbox-cleanup", {
        headers: {
          authorization: "Bearer expected-secret",
        },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      deletedCount: 2,
      deletedSandboxNames: ["sandbox-a", "sandbox-b"],
      expiresBefore: "2026-05-27T12:00:00.000Z",
      inspectedCount: 3,
      retentionDays: 7,
      scheduleUtc: "0 21 * * *",
      skippedCount: 1,
    });
  });
});
