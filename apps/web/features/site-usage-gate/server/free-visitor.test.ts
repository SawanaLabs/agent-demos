import { describe, expect, it } from "vitest";
import { resolveFreeVisitorId } from "./free-visitor";

const environment = {
  VERCEL: "1",
  SITE_USAGE_VISITOR_SECRET: "test-secret-with-at-least-32-characters",
};
function request(cookie = "", ip = "203.0.113.1", ua = "Test Browser") {
  return new Request("https://example.test", {
    headers: {
      cookie,
      "x-vercel-forwarded-for": ip,
      "user-agent": ua,
      "x-forwarded-for": "untrusted-input",
    },
  });
}
describe("free visitor identity", () => {
  it("ignores cleared or changed cookies and uses the trusted edge IP", () => {
    const first = resolveFreeVisitorId(
      request("site_visitor_id=visitor-a"),
      environment
    );
    expect(resolveFreeVisitorId(request(), environment)).toBe(first);
    expect(
      resolveFreeVisitorId(request("site_visitor_id=visitor-b"), environment)
    ).toBe(first);
    expect(first).toMatch(/^free-v1-[a-f0-9]{64}$/);
    expect(
      resolveFreeVisitorId(request("", "203.0.113.2"), environment)
    ).not.toBe(first);
    expect(
      resolveFreeVisitorId(
        request("", "203.0.113.1", "Other Browser"),
        environment
      )
    ).not.toBe(first);
  });
  it("fails closed without a secret or trusted IP on Vercel", () => {
    expect(() => resolveFreeVisitorId(request(), { VERCEL: "1" })).toThrow(
      "SECRET"
    );
    expect(() =>
      resolveFreeVisitorId(
        new Request("https://example.test", {
          headers: { "x-forwarded-for": "203.0.113.1" },
        }),
        environment
      )
    ).toThrow("Trusted visitor IP");
    expect(() =>
      resolveFreeVisitorId(request(), { NODE_ENV: "production" })
    ).toThrow("trusted Vercel edge");
  });
  it("ignores spoofable forwarding headers during local development", () => {
    expect(resolveFreeVisitorId(request(), {})).toBe(
      resolveFreeVisitorId(request("", "203.0.113.2"), {})
    );
  });
});
