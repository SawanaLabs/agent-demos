import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/site-runtime-logging/server/server-logger", () => ({
  runtimeErrorLogger: { error: vi.fn() },
}));

import {
  createMeteredDemoRouteFactory,
  type MeteredDemoRouteMeter,
  type MeteredDemoRouteTelemetry,
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

it("passes the server-owned message exemption to the resource meter", async () => {
  const handleMeteredRequest = vi.fn(async (_request, _options, handler) =>
    handler()
  );
  const { createMeteredDemoRoute } = createMeteredDemoRouteFactory({
    meter: { handleMeteredRequest },
  });
  const route = createMeteredDemoRoute({
    action: "send_message",
    demoSlug: "canvas-agent",
    chargeMessage: false,
    handler: async () => Response.json({ ok: true }),
  });
  const request = new Request("http://localhost/api/demos/canvas-agent");
  await route(request, undefined);
  expect(handleMeteredRequest).toHaveBeenCalledWith(
    request,
    { action: "send_message", demoSlug: "canvas-agent", chargeMessage: false },
    expect.any(Function)
  );
});

describe("metered demo route telemetry", () => {
  it("marks one accepted action after a successful route response", async () => {
    const markAcceptedAction = vi.fn();
    const reportUnexpectedFailure = vi.fn();
    const telemetry: MeteredDemoRouteTelemetry = {
      markAcceptedAction,
      reportUnexpectedFailure,
    };
    const meter: MeteredDemoRouteMeter = {
      async handleMeteredRequest(_request, _options, handler) {
        return handler();
      },
    };
    const route = createMeteredDemoRouteFactory({
      meter,
      telemetry,
    }).createMeteredDemoRoute({
      action: "send_message",
      demoSlug: "object-generation",
      handler: async () => Response.json({ ok: true }),
      productAction: "generate_object",
    });

    const response = await route(
      new Request("http://localhost/api/demos/object-generation", {
        method: "POST",
      }),
      undefined
    );

    expect(response.ok).toBe(true);
    expect(markAcceptedAction).toHaveBeenCalledOnce();
    expect(markAcceptedAction).toHaveBeenCalledWith(response, {
      action: "generate_object",
      demoSlug: "object-generation",
    });
    expect(reportUnexpectedFailure).not.toHaveBeenCalled();
  });

  it("reports one terminal 5xx and keeps expected 4xx paths silent", async () => {
    const markAcceptedAction = vi.fn();
    const reportUnexpectedFailure = vi.fn();
    const telemetry: MeteredDemoRouteTelemetry = {
      markAcceptedAction,
      reportUnexpectedFailure,
    };
    const responses = [
      Response.json({ error: "invalid" }, { status: 400 }),
      Response.json({ error: "failed" }, { status: 500 }),
    ];
    const meter: MeteredDemoRouteMeter = {
      async handleMeteredRequest() {
        const response = responses.shift();

        if (!response) {
          throw new Error("Missing test response.");
        }

        return response;
      },
    };
    const route = createMeteredDemoRouteFactory({
      meter,
      telemetry,
    }).createMeteredDemoRoute({
      action: "send_message",
      demoSlug: "foundation-chat",
      handler: async () => Response.json({ ok: true }),
    });

    expect(
      (
        await route(
          new Request("http://localhost/api/demos/foundation-chat", {
            method: "POST",
          }),
          undefined
        )
      ).status
    ).toBe(400);
    expect(reportUnexpectedFailure).not.toHaveBeenCalled();
    expect(
      (
        await route(
          new Request("http://localhost/api/demos/foundation-chat", {
            method: "POST",
          }),
          undefined
        )
      ).status
    ).toBe(500);
    expect(reportUnexpectedFailure).toHaveBeenCalledOnce();
    expect(reportUnexpectedFailure).toHaveBeenCalledWith({
      action: "send_message",
      demoSlug: "foundation-chat",
    });
    expect(markAcceptedAction).not.toHaveBeenCalled();
  });

  it("reports a thrown terminal failure once and preserves the original error", async () => {
    const originalError = new Error("provider failed");
    const telemetry: MeteredDemoRouteTelemetry = {
      markAcceptedAction: vi.fn(),
      reportUnexpectedFailure: vi.fn(),
    };
    const meter: MeteredDemoRouteMeter = {
      async handleMeteredRequest() {
        throw originalError;
      },
    };
    const route = createMeteredDemoRouteFactory({
      meter,
      telemetry,
    }).createMeteredDemoRoute({
      action: "evaluate",
      demoSlug: "trace-eval-agent",
      handler: async () => Response.json({ ok: true }),
    });

    await expect(
      route(
        new Request("http://localhost/api/demos/trace-eval-agent/evaluate", {
          method: "POST",
        }),
        undefined
      )
    ).rejects.toBe(originalError);
    expect(telemetry.reportUnexpectedFailure).toHaveBeenCalledOnce();
    expect(telemetry.markAcceptedAction).not.toHaveBeenCalled();
  });
});
