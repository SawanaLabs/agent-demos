import { describe, expect, it } from "vitest";

import {
  listDemoCatalogForMcp,
  readDemoDocsForMcp,
  searchProjectDocsForMcp,
} from "./project-tools";

describe("project MCP tools", () => {
  it("lists ready demos with mcp-agent included", () => {
    const demos = listDemoCatalogForMcp({ status: "ready" });

    expect(demos.some((demo) => demo.slug === "mcp-agent")).toBe(true);
    expect(demos.every((demo) => demo.status === "ready")).toBe(true);
  });

  it("reads a demo docs bundle by slug", async () => {
    const docs = await readDemoDocsForMcp({ slug: "sandbox-agent" });

    expect(docs.slug).toBe("sandbox-agent");
    expect(docs.files.map((file) => file.path)).toContain(
      "docs/frontend/sandbox-agent.md"
    );
  });

  it("searches durable project docs snippets", async () => {
    const result = await searchProjectDocsForMcp({ query: "MCP" });

    expect(result.query).toBe("MCP");
    expect(result.matches.length).toBeGreaterThan(0);
  });
});
