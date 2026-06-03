import { describe, expect, it, vi } from "vitest";
import {
  cleanupExpiredSiteUsageEvents,
  siteUsageCleanupRetentionDays,
} from "./cleanup";

describe("site usage cleanup", () => {
  it("deletes usage events older than the retention window", async () => {
    const deleteEventsOlderThan = vi.fn(async () => 3);
    const result = await cleanupExpiredSiteUsageEvents({
      now: new Date("2026-05-29T10:00:00.000Z"),
      persistence: {
        deleteEventsOlderThan,
      },
    });

    expect(deleteEventsOlderThan).toHaveBeenCalledWith(
      new Date("2026-05-22T10:00:00.000Z")
    );
    expect(result).toEqual({
      cutoff: "2026-05-22T10:00:00.000Z",
      deletedEvents: 3,
      retentionDays: siteUsageCleanupRetentionDays,
    });
  });
});
