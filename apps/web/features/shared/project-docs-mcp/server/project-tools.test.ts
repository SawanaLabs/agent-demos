import { describe, expect, it } from "vitest";

import { searchProjectDocsForMcp } from "./project-tools";

describe("project docs MCP search", () => {
  it("finds useful docs for long mixed-language product queries", async () => {
    const result = await searchProjectDocsForMcp({
      limit: 10,
      query:
        "基于项目文档解释 Ultra Chatbot Agent 和 Persistent Agent 的核心区别",
    });

    expect(result.matches.length).toBeGreaterThan(0);
    expect(
      result.matches.some((match) =>
        `${match.path} ${match.text}`.toLowerCase().includes("ultra")
      )
    ).toBe(true);
  });
});
