import type { ToolPart } from "@workspace/ui/components/ai-elements/tool";
import { describe, expect, it } from "vitest";

import { hasVisibleToolPayload } from "./trace-eval-agent-model";

function createToolPart(overrides: Partial<ToolPart> = {}): ToolPart {
  return {
    input: {},
    output: {},
    state: "output-available",
    toolCallId: "tool_1",
    type: "tool-web_search",
    ...overrides,
  } as ToolPart;
}

describe("hasVisibleToolPayload", () => {
  it("hides empty tool payloads", () => {
    expect(hasVisibleToolPayload(createToolPart())).toBe(false);
  });

  it("shows tool parts when input carries a real query", () => {
    expect(
      hasVisibleToolPayload(
        createToolPart({
          input: {
            query: "langfuse vs braintrust",
          },
        })
      )
    ).toBe(true);
  });

  it("shows tool parts when output contains real data or errors", () => {
    expect(
      hasVisibleToolPayload(
        createToolPart({
          output: {
            sources: ["https://example.com"],
          },
        })
      )
    ).toBe(true);

    expect(
      hasVisibleToolPayload(
        createToolPart({
          errorText: "Search failed",
        })
      )
    ).toBe(true);
  });
});
