import { expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

it.skipIf(process.env.SITE_USAGE_DATABASE_INTEGRATION !== "1")(
  "atomically spends credits across concurrent transactions without overdrawing",
  async () => {
    const { createDatabaseSiteUsageGateStore } = await import("./store");
    const { database, siteUsageVisitors, siteUsageAccessCodes } = await import(
      "@workspace/database"
    );
    const { eq, inArray } = await import("@workspace/database/drizzle");
    const visitorId = `credit-test-${crypto.randomUUID()}`;
    const cookieId = `cookie-test-${crypto.randomUUID()}`;
    const codeId = crypto.randomUUID();
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
            visitorId: `cookie-${crypto.randomUUID()}`,
            freeVisitorId: visitorId,
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
      const { readCreditBalance } = await import("./balance");
      expect(
        (await readCreditBalance(store, cookieId, now, visitorId))
          .remainingUnits
      ).toBe(0);
      await database.insert(siteUsageAccessCodes).values({
        id: codeId,
        code: `test-${codeId}`,
        allowanceUnits: 100,
        windowSeconds: 18_000,
      });
      await database
        .update(siteUsageVisitors)
        .set({ activeAccessCodeId: codeId })
        .where(eq(siteUsageVisitors.id, cookieId));
      const invited = await store.reserveCredits({
        action: "send_message",
        demoSlug: "credit-contract-test",
        createdAt: now,
        visitorId: cookieId,
        freeVisitorId: visitorId,
        units: 1,
      });
      expect(invited.allowed).toBe(true);
      expect(invited.balance.remainingUnits).toBe(99);
      expect(
        (await readCreditBalance(store, cookieId, now, visitorId))
          .remainingUnits
      ).toBe(99);
      await database
        .update(siteUsageAccessCodes)
        .set({ isEnabled: false })
        .where(eq(siteUsageAccessCodes.id, codeId));
      expect(
        (await readCreditBalance(store, cookieId, now, visitorId))
          .remainingUnits
      ).toBe(0);
      expect(
        (
          await store.reserveCredits({
            action: "send_message",
            demoSlug: "credit-contract-test",
            createdAt: now,
            visitorId: cookieId,
            freeVisitorId: visitorId,
            units: 1,
          })
        ).allowed
      ).toBe(false);
    } finally {
      // Only this test's unique visitor and its cascading credit rows are removed.
      await database
        .delete(siteUsageVisitors)
        .where(inArray(siteUsageVisitors.id, [visitorId, cookieId]));
      await database
        .delete(siteUsageAccessCodes)
        .where(eq(siteUsageAccessCodes.id, codeId));
    }
  }
);
