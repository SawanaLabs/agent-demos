import { Sandbox } from "@vercel/sandbox";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanupExpiredVercelSandboxIdentities,
  vercelSandboxCleanupCronScheduleUtc,
} from "./cleanup";
import { VERCEL_SANDBOX_DEMO_APP_TAG } from "./session";

const sandboxState = vi.hoisted(() => ({
  get: vi.fn(),
  list: vi.fn(),
}));

vi.mock("@vercel/sandbox", () => ({
  Sandbox: sandboxState,
}));

const millisecondsPerDay = 24 * 60 * 60 * 1000;
const retentionTag = "7d";

function createSandboxListResult(
  sandboxes: Array<{
    createdAt?: number;
    name: string;
    tags?: Record<string, string>;
    updatedAt?: number;
  }>
) {
  return {
    pagination: {
      count: sandboxes.length,
      next: null,
    },
    sandboxes,
    toArray: vi.fn().mockResolvedValue(sandboxes),
  };
}

describe("vercel sandbox identity cleanup", () => {
  beforeEach(() => {
    sandboxState.get.mockReset();
    sandboxState.list.mockReset();
  });

  it("deletes only expired demo-tagged sandbox identities", async () => {
    const now = new Date("2026-06-03T12:00:00.000Z");
    const deletedSandbox = { delete: vi.fn().mockResolvedValue(undefined) };
    sandboxState.list.mockResolvedValue(
      createSandboxListResult([
        {
          createdAt: now.getTime() - 10 * millisecondsPerDay,
          name: "expired-demo",
          tags: {
            app: VERCEL_SANDBOX_DEMO_APP_TAG,
            retention: retentionTag,
          },
          updatedAt: now.getTime() - 8 * millisecondsPerDay,
        },
        {
          createdAt: now.getTime() - 10 * millisecondsPerDay,
          name: "fresh-demo",
          tags: {
            app: VERCEL_SANDBOX_DEMO_APP_TAG,
            retention: retentionTag,
          },
          updatedAt: now.getTime() - 6 * millisecondsPerDay,
        },
        {
          createdAt: now.getTime() - 10 * millisecondsPerDay,
          name: "wrong-app",
          tags: {
            app: "other-app",
            retention: retentionTag,
          },
          updatedAt: now.getTime() - 8 * millisecondsPerDay,
        },
        {
          name: "missing-timestamps",
          tags: {
            app: VERCEL_SANDBOX_DEMO_APP_TAG,
            retention: retentionTag,
          },
        },
      ])
    );
    sandboxState.get.mockResolvedValue(deletedSandbox);

    const result = await cleanupExpiredVercelSandboxIdentities({
      env: {
        VERCEL_OIDC_TOKEN: "oidc-token",
      },
      now,
    });

    expect(Sandbox.list).toHaveBeenCalledWith({
      tags: {
        app: VERCEL_SANDBOX_DEMO_APP_TAG,
        retention: retentionTag,
      },
    });
    expect(Sandbox.get).toHaveBeenCalledTimes(1);
    expect(Sandbox.get).toHaveBeenCalledWith({
      name: "expired-demo",
      resume: false,
    });
    expect(deletedSandbox.delete).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      deletedCount: 1,
      deletedSandboxNames: ["expired-demo"],
      expiresBefore: "2026-05-27T12:00:00.000Z",
      inspectedCount: 4,
      retentionDays: 7,
      skippedCount: 3,
    });
  });

  it("passes token credentials through list and delete lookups", async () => {
    const now = new Date("2026-06-03T12:00:00.000Z");
    const deletedSandbox = { delete: vi.fn().mockResolvedValue(undefined) };
    sandboxState.list.mockResolvedValue(
      createSandboxListResult([
        {
          createdAt: now.getTime() - 8 * millisecondsPerDay,
          name: "token-demo",
          tags: {
            app: VERCEL_SANDBOX_DEMO_APP_TAG,
            retention: retentionTag,
          },
          updatedAt: now.getTime() - 8 * millisecondsPerDay,
        },
      ])
    );
    sandboxState.get.mockResolvedValue(deletedSandbox);

    await cleanupExpiredVercelSandboxIdentities({
      env: {
        VERCEL_PROJECT_ID: "project-id",
        VERCEL_TEAM_ID: "team-id",
        VERCEL_TOKEN: "vercel-token",
      },
      now,
    });

    expect(Sandbox.list).toHaveBeenCalledWith({
      projectId: "project-id",
      tags: {
        app: VERCEL_SANDBOX_DEMO_APP_TAG,
        retention: retentionTag,
      },
      teamId: "team-id",
      token: "vercel-token",
    });
    expect(Sandbox.get).toHaveBeenCalledWith({
      name: "token-demo",
      projectId: "project-id",
      resume: false,
      teamId: "team-id",
      token: "vercel-token",
    });
  });

  it("publishes the daily UTC cron schedule used by vercel.json", () => {
    expect(vercelSandboxCleanupCronScheduleUtc).toBe("0 21 * * *");
  });
});
