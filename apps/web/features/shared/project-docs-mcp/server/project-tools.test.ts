import { describe, expect, it } from "vitest";

import {
  listDemoCatalogForMcp,
  readDemoDocsForMcp,
  searchProjectDocsForMcp,
  searchProjectSourcesForMcp,
} from "./project-tools";

describe("project docs MCP search", () => {
  it("keeps the project guide companion searchable but outside the demo catalog", async () => {
    const demos = await listDemoCatalogForMcp();
    const searchResult = await searchProjectDocsForMcp({
      query: "Project Guide Companion",
    });

    expect(demos.some((demo) => demo.slug === "project-guide-companion")).toBe(
      false
    );
    expect(
      searchResult.matches.some(
        (match) => match.path === "docs/frontend/project-guide-companion.md"
      )
    ).toBe(true);
    await expect(
      readDemoDocsForMcp({ slug: "project-guide-companion" })
    ).rejects.toThrow("Unknown demo slug: project-guide-companion");
  });

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

  it("searches allowlisted project source files without generated or private paths", async () => {
    const result = await searchProjectSourcesForMcp({
      limit: 20,
      query: "createProjectDocsMcpServer",
    });

    expect(result.matches).toContainEqual(
      expect.objectContaining({
        path: "apps/web/features/shared/project-docs-mcp/server/project-mcp-server.ts",
      })
    );
    expect(
      result.matches.every((match) =>
        [
          "apps/web/features/",
          "apps/web/app/",
          "packages/",
          "apps/langgraph-agent-api/",
        ].some((root) => match.path.startsWith(root))
      )
    ).toBe(true);
    expect(
      result.matches.every(
        (match) =>
          !(match.path.includes("/public/r/") || match.path.includes(".env"))
      )
    ).toBe(true);

    const generatedResult = await searchProjectSourcesForMcp({
      limit: 20,
      query: "_journal",
    });

    expect(
      generatedResult.matches.every(
        (match) => !match.path.startsWith("packages/database/drizzle/meta/")
      )
    ).toBe(true);
  });
});
