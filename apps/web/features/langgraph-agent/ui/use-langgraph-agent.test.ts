import { describe, expect, it, vi } from "vitest";

import { createLangGraphThreadId } from "./use-langgraph-agent";

describe("createLangGraphThreadId", () => {
  it("returns a LangGraph-compatible UUID thread id", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "8992600f-cd01-43a5-9463-a960efdd509f"
    );

    expect(createLangGraphThreadId()).toBe(
      "8992600f-cd01-43a5-9463-a960efdd509f"
    );
  });
});
