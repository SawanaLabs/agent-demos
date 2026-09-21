import { expect, it, vi } from "vitest";
import { readCreditBalance } from "./balance";
import type { SiteUsageGateStore } from "./route-wrapper";

it("reads free usage by server identity and invitation usage by cookie identity", async () => {
  const listUsageEventsSince = vi.fn(async () => []);
  const ensureVisitor = vi.fn<SiteUsageGateStore["ensureVisitor"]>();
  const store: SiteUsageGateStore = {
    ensureVisitor,
    listUsageEventsSince,
    reserveCredits: vi.fn(),
    refundCredits: vi.fn(),
  };
  const now = new Date("2026-09-21T12:00:00Z");
  ensureVisitor.mockResolvedValue({ activeAccessCodePolicy: null });
  expect(
    (await readCreditBalance(store, "cookie-a", now, "free-identity"))
      .allowanceUnits
  ).toBe(50);
  expect(listUsageEventsSince).toHaveBeenLastCalledWith(
    expect.objectContaining({ visitorId: "free-identity" })
  );
  ensureVisitor.mockResolvedValue({
    activeAccessCodePolicy: { allowanceUnits: 100, windowSeconds: 18_000 },
  });
  expect(
    (await readCreditBalance(store, "cookie-a", now, "free-identity"))
      .allowanceUnits
  ).toBe(100);
  expect(listUsageEventsSince).toHaveBeenLastCalledWith(
    expect.objectContaining({ visitorId: "cookie-a" })
  );
});
