import { describe, expect, it, vi } from "vitest";
import { siteUsageLimitErrorCode } from "../contract";
import { createSiteUsageGate, type SiteUsageGateStore } from "./route-wrapper";
import { siteUsageVisitorCookieName } from "./viewer-context";

const now = new Date("2026-05-29T10:00:00.000Z");

function createStore(
  events: Date[] = [],
  policy: { allowanceUnits: number; windowSeconds?: number } = {
    allowanceUnits: 10,
  }
) {
  const calls: string[] = [];
  const usageEvents = [...events];
  const store: SiteUsageGateStore = {
    async createUsageEvent() {
      calls.push("usage-event");
      usageEvents.push(now);
    },
    async ensureVisitor() {
      return {
        activeAccessCodePolicy:
          policy.windowSeconds === undefined
            ? null
            : {
                allowanceUnits: policy.allowanceUnits,
                windowSeconds: policy.windowSeconds,
              },
      };
    },
    async listUsageEventsSince({ since }) {
      return usageEvents
        .filter((event) => event.getTime() >= since.getTime())
        .map((createdAt) => ({ createdAt }));
    },
  };

  return { calls, store, usageEvents };
}

describe("site usage gate route wrapper", () => {
  it("returns structured 429 and does not call the handler when the visitor is out of quota", async () => {
    const { calls, store } = createStore(
      Array.from({ length: 10 }, (_, index) => {
        const event = new Date(now);
        event.setUTCHours(index);
        return event;
      })
    );
    const gate = createSiteUsageGate({ clock: () => now, store });
    const handler = vi.fn(async () => Response.json({ ok: true }));

    const response = await gate.handleMeteredRequest(
      new Request("http://localhost/api/demos/foundation-chat", {
        headers: {
          cookie: `${siteUsageVisitorCookieName}=visitor-1`,
        },
        method: "POST",
      }),
      {
        action: "send_message",
        demoSlug: "foundation-chat",
      },
      handler
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      code: siteUsageLimitErrorCode,
      policy: {
        allowanceUnits: 10,
      },
      resetAt: "2026-05-30T00:00:00.000Z",
    });
    expect(handler).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it("records usage only after a successful handler response", async () => {
    const { calls, store } = createStore();
    const gate = createSiteUsageGate({
      clock: () => now,
      createVisitorId: () => "visitor-new",
      store,
    });
    const handler = vi.fn(async () => {
      calls.push("handler");
      return Response.json({ ok: true });
    });

    const response = await gate.handleMeteredRequest(
      new Request("http://localhost/api/demos/foundation-chat", {
        method: "POST",
      }),
      {
        action: "send_message",
        demoSlug: "foundation-chat",
      },
      handler
    );

    expect(response.status).toBe(200);
    expect(calls).toEqual(["handler", "usage-event"]);
    expect(response.headers.get("set-cookie")).toContain(
      `${siteUsageVisitorCookieName}=visitor-new`
    );
  });

  it("does not record usage when the handler returns a validation error", async () => {
    const { calls, store } = createStore();
    const gate = createSiteUsageGate({ clock: () => now, store });

    const response = await gate.handleMeteredRequest(
      new Request("http://localhost/api/demos/foundation-chat", {
        headers: {
          cookie: `${siteUsageVisitorCookieName}=visitor-1`,
        },
        method: "POST",
      }),
      {
        action: "send_message",
        demoSlug: "foundation-chat",
      },
      async () => new Response("bad request", { status: 400 })
    );

    expect(response.status).toBe(400);
    expect(calls).toEqual([]);
  });
});
