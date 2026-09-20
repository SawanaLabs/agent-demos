import { expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

it.skipIf(process.env.SITE_USAGE_DATABASE_INTEGRATION !== "1")(
  "atomically spends credits across concurrent transactions without overdrawing",
  async () => {
    const { createDatabaseSiteUsageGateStore } = await import("./store");
    const { database, siteUsageVisitors } = await import("@workspace/database");
    const { eq } = await import("@workspace/database/drizzle");
    const visitorId = `credit-test-${crypto.randomUUID()}`;
    const store = createDatabaseSiteUsageGateStore();
    const now = new Date();
    try {
      const results = await Promise.allSettled(
        Array.from({ length: 12 }, () =>
          store.reserveCredits({
            action: "image_generation",
            createdAt: now,
            demoSlug: "credit-contract-test",
            units: 5,
            visitorId,
          })
        )
      );
      const reservations = results.map((result) => {
        if (result.status === "rejected") {
          throw result.reason;
        }
        return result.value;
      });
      expect(reservations.filter((result) => result.allowed)).toHaveLength(10);
      expect(reservations.filter((result) => !result.allowed)).toHaveLength(2);
      expect(
        await store.listUsageEventsSince({
          now,
          since: new Date(now.getTime() - 60_000),
          visitorId,
        })
      ).toHaveLength(50);
      const charged = reservations.find((result) => result.allowed);
      expect(charged?.eventIds).toHaveLength(5);
      await store.refundCredits(charged?.eventIds ?? []);
      const next = await store.reserveCredits({
        action: "image_generation",
        createdAt: now,
        demoSlug: "credit-contract-test",
        units: 5,
        visitorId,
      });
      expect(next.allowed).toBe(true);
      expect(next.balance.remainingUnits).toBe(0);
    } finally {
      // Only this test's unique visitor and its cascading credit rows are removed.
      await database
        .delete(siteUsageVisitors)
        .where(eq(siteUsageVisitors.id, visitorId));
    }
  }
);
