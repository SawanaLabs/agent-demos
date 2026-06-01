import { describe, expect, it, vi } from "vitest";
import {
  createMeteredDemoRouteFactory,
  type MeteredDemoRouteMeter,
} from "./metered-demo-route";

describe("metered demo route module", () => {
  it("does not enter the demo visitor owner or runtime when metering rejects the request", async () => {
    const meter: MeteredDemoRouteMeter = {
      async handleMeteredRequest() {
        return Response.json(
          { code: "SITE_USAGE_LIMIT_EXCEEDED" },
          {
            status: 429,
          }
        );
      },
    };
    const handleVisitorRequest = vi.fn(async (request, handler) =>
      handler(request, {
        isNewVisitor: true,
        shouldSetCookie: true,
        visitorId: "demo-visitor",
      })
    );
    const runtime = vi.fn(async () => Response.json({ ok: true }));
    const routeFactory = createMeteredDemoRouteFactory({ meter });

    const route = routeFactory.createVisitorOwnedMeteredDemoRoute({
      action: "send_message",
      demoSlug: "persistent-agent",
      handleVisitorRequest,
      handler: runtime,
    });

    const response = await route(
      new Request("http://localhost/api/demos/persistent-agent", {
        method: "POST",
      }),
      undefined
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      code: "SITE_USAGE_LIMIT_EXCEEDED",
    });
    expect(handleVisitorRequest).not.toHaveBeenCalled();
    expect(runtime).not.toHaveBeenCalled();
  });

  it("runs the demo visitor owner inside the metered route and keeps both visitor cookies on success", async () => {
    const calls: string[] = [];
    const meter: MeteredDemoRouteMeter = {
      async handleMeteredRequest(_request, options, handler) {
        calls.push(`meter:${options.action}:${options.demoSlug}`);
        const response = await handler();
        calls.push("usage-event");
        response.headers.append(
          "set-cookie",
          "site_visitor_id=site-visitor; Path=/; HttpOnly"
        );
        return response;
      },
    };
    const handleVisitorRequest = vi.fn(async (request, handler) => {
      calls.push("visitor-owner");
      const response = await handler(request, {
        isNewVisitor: true,
        shouldSetCookie: true,
        visitorId: "demo-visitor",
      });
      response.headers.append(
        "set-cookie",
        "demo_visitor_id=demo-visitor; Path=/; HttpOnly"
      );
      return response;
    });
    const routeFactory = createMeteredDemoRouteFactory({ meter });

    const route = routeFactory.createVisitorOwnedMeteredDemoRoute({
      action: "send_message",
      demoSlug: "persistent-agent",
      handleVisitorRequest,
      handler: async ({ visitor }) => {
        calls.push(`runtime:${visitor.visitorId}`);
        return Response.json({ visitorId: visitor.visitorId });
      },
    });

    const response = await route(
      new Request("http://localhost/api/demos/persistent-agent", {
        method: "POST",
      }),
      undefined
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      visitorId: "demo-visitor",
    });
    expect(calls).toEqual([
      "meter:send_message:persistent-agent",
      "visitor-owner",
      "runtime:demo-visitor",
      "usage-event",
    ]);
    expect(response.headers.get("set-cookie")).toContain(
      "demo_visitor_id=demo-visitor"
    );
    expect(response.headers.get("set-cookie")).toContain(
      "site_visitor_id=site-visitor"
    );
    expect(handleVisitorRequest).toHaveBeenCalledTimes(1);
  });
});
