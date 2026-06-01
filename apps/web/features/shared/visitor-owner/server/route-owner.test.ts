import { describe, expect, it, vi } from "vitest";
import { createVisitorOwner } from "./route-owner";

describe("visitor owner route module", () => {
  it("passes a created visitor id to the handler and appends the owner cookie", async () => {
    const owner = createVisitorOwner({
      cookieName: "demo_visitor_id",
      createVisitorId: () => "visitor-new",
      maxAgeSeconds: 60,
    });
    const handler = vi.fn(async (_request: Request, visitor) =>
      Response.json({ visitorId: visitor.visitorId })
    );

    const response = await owner.handleOwnedRequest(
      new Request("http://localhost/api/demos/example", {
        method: "POST",
      }),
      handler
    );

    await expect(response.json()).resolves.toEqual({
      visitorId: "visitor-new",
    });
    expect(response.headers.get("set-cookie")).toBe(
      "demo_visitor_id=visitor-new; Path=/; HttpOnly; SameSite=Lax; Max-Age=60"
    );
    expect(handler).toHaveBeenCalledOnce();
  });

  it("reuses an existing visitor id without appending a cookie", async () => {
    const owner = createVisitorOwner({
      cookieName: "demo_visitor_id",
      createVisitorId: () => "visitor-new",
      maxAgeSeconds: 60,
    });

    const response = await owner.handleOwnedRequest(
      new Request("http://localhost/api/demos/example", {
        headers: {
          cookie: "other=value; demo_visitor_id=visitor-existing",
        },
        method: "POST",
      }),
      async (_request, visitor) => Response.json({ visitorId: visitor.visitorId })
    );

    await expect(response.json()).resolves.toEqual({
      visitorId: "visitor-existing",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("replaces an invalid visitor id using the owner policy", async () => {
    const owner = createVisitorOwner({
      cookieName: "demo_visitor_id",
      createVisitorId: () => "visitor-new",
      isValidVisitorId: (visitorId) => visitorId.startsWith("visitor-"),
      maxAgeSeconds: 60,
    });

    const visitor = owner.resolveVisitor(
      new Request("http://localhost/api/demos/example", {
        headers: {
          cookie: "demo_visitor_id=bad",
        },
      })
    );

    expect(visitor).toEqual({
      isNewVisitor: true,
      shouldSetCookie: true,
      visitorId: "visitor-new",
    });
  });
});
