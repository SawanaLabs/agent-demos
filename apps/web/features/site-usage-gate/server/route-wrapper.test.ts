import { describe, expect, it, vi } from "vitest";
import { consumeResource } from "@/features/shared/resource-usage/server/context";
import { creditBalance } from "./balance";
import { resolveSiteUsagePolicy } from "./policy";
import { createSiteUsageGate, type SiteUsageGateStore } from "./route-wrapper";

const now = new Date("2026-05-29T10:00:00.000Z");
function fixture(used = 0) {
  const events = new Map(
    Array.from({ length: used }, (_, i) => [`existing-${i}`, now])
  );
  const store: SiteUsageGateStore = {
    async ensureVisitor() {
      return { activeAccessCodePolicy: null };
    },
    async listUsageEventsSince() {
      return [...events.values()].map((createdAt) => ({ createdAt }));
    },
    async reserveCredits({ units }) {
      const balance = creditBalance(
        resolveSiteUsagePolicy({ now, activeAccessCodePolicy: null }),
        [...events.values()].map((createdAt) => ({ createdAt }))
      );
      if (balance.remainingUnits < units) {
        return { allowed: false, balance, eventIds: [] };
      }
      const eventIds = Array.from({ length: units }, () => crypto.randomUUID());
      for (const id of eventIds) {
        events.set(id, now);
      }
      return {
        allowed: true,
        balance: { ...balance, remainingUnits: balance.remainingUnits - units },
        eventIds,
      };
    },
    async refundCredits(ids) {
      for (const id of ids) {
        events.delete(id);
      }
    },
  };
  const gate = createSiteUsageGate({ clock: () => now, store });
  const request = new Request("http://localhost/api/demos/canvas-agent");
  const run = (handler: () => Promise<Response>) =>
    gate.handleMeteredRequest(
      request,
      { action: "send_message", demoSlug: "canvas-agent" },
      handler
    );
  return { events, run };
}

describe("credit gate", () => {
  it("charges 1 for a message and 5 per image in the same workflow", async () => {
    const { events, run } = fixture();
    await run(async () => {
      expect(events.size).toBe(1);
      await consumeResource("image_generation");
      await consumeResource("image_generation");
      return Response.json({ ok: true });
    });
    expect(events.size).toBe(11);
  });
  it("rejects an operation before executing it when remaining credits cannot cover its cost", async () => {
    const { events, run } = fixture(46);
    const provider = vi.fn();
    const response = await run(async () => {
      await consumeResource("image_generation");
      provider();
      return Response.json({ ok: true });
    });
    expect(response.status).toBe(429);
    expect(provider).not.toHaveBeenCalled();
    expect(events.size).toBe(46);
    expect(await response.json()).toMatchObject({
      requiredUnits: 6,
      policy: { remainingUnits: 4 },
      resetAt: "2026-05-30T00:00:00.000Z",
    });
  });
  it("blocks exhausted visitors before entering the demo", async () => {
    const { run } = fixture(50);
    const handler = vi.fn();
    expect((await run(handler)).status).toBe(429);
    expect(handler).not.toHaveBeenCalled();
  });
  it("refunds invalid requests and keeps the visitor cookie", async () => {
    const { events, run } = fixture();
    const response = await run(
      async () => new Response("Invalid", { status: 400 })
    );
    expect(events.size).toBe(0);
    expect(response.headers.get("set-cookie")).toContain("site_visitor_id=");
  });
  it("keeps charging and enforcing the budget after streaming headers have returned", async () => {
    const { run, events } = fixture(43);
    let proceed: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
      proceed = resolve;
    });
    const response = await run(
      async () =>
        new Response(
          new ReadableStream({
            async start(controller) {
              await ready;
              await consumeResource("image_generation");
              try {
                await consumeResource("image_generation");
                controller.enqueue("unexpected");
              } catch (error) {
                controller.enqueue(
                  new TextEncoder().encode((error as Error).message)
                );
              }
              controller.close();
            },
          })
        )
    );
    proceed();
    expect(await response.text()).toContain("Not enough demo credits");
    expect(events.size).toBe(49);
  });
  it("charges resource prices for RAG, Sandbox and workflow text", async () => {
    const { events, run } = fixture();
    await run(async () => {
      await consumeResource("rag_search");
      await consumeResource("sandbox_start");
      await consumeResource("text_generation");
      return Response.json({ ok: true });
    });
    expect(events.size).toBe(7);
  });
});

it("reserves batch image credits atomically without partial charges on denial", async () => {
  const { events, run } = fixture(40);
  const response = await run(async () => {
    await consumeResource("image_generation", 3);
    return Response.json({ ok: true });
  });
  expect(response.status).toBe(429);
  expect(events.size).toBe(40);
  const allowed = fixture();
  await allowed.run(async () => {
    await consumeResource("image_generation", 3);
    return Response.json({ ok: true });
  });
  expect(allowed.events.size).toBe(16);
});
