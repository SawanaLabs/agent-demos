import { describe, expect, it } from "vitest";

import { acceptedDemoActionHeader } from "../shared/demo-action-contract";
import { markAcceptedDemoAction } from "./demo-route-adapter";

describe("demo route product analytics adapter", () => {
  it("marks one accepted catalog action without identity data", () => {
    const response = Response.json({ ok: true });

    markAcceptedDemoAction(response, {
      action: "generate_object",
      demoSlug: "object-generation",
    });

    expect(response.headers.get(acceptedDemoActionHeader)).toBe(
      "object-generation:generate_object"
    );
  });

  it("does not mark failed responses or unknown actions", () => {
    const failedResponse = Response.json({ error: "failed" }, { status: 500 });
    const unknownResponse = Response.json({ ok: true });

    markAcceptedDemoAction(failedResponse, {
      action: "send_message",
      demoSlug: "foundation-chat",
    });
    markAcceptedDemoAction(unknownResponse, {
      action: "clicked_anything",
      demoSlug: "private-demo",
    });

    expect(failedResponse.headers.has(acceptedDemoActionHeader)).toBe(false);
    expect(unknownResponse.headers.has(acceptedDemoActionHeader)).toBe(false);
  });
});
