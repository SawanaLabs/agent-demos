import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  createMcpRuntimeSummary,
  formatMcpRuntimeSummary,
  namespaceMcpTools,
} from "./mcp-toolbox";

describe("mcp-agent toolbox", () => {
  it("prefixes MCP tool names to keep multiple servers collision-free", () => {
    const tools = namespaceMcpTools("project", {
      list_demos: {
        description: "List demos",
        execute: async () => "ok",
        inputSchema: z.object({}),
      },
    });

    expect(Object.keys(tools)).toEqual(["project__list_demos"]);
  });

  it("formats ready and unavailable MCP servers for the model prompt", () => {
    const summary = createMcpRuntimeSummary([
      {
        instructions: "Use project docs for repository questions.",
        name: "project-docs",
        status: "ready",
        toolNames: ["project__list_demos", "project__search_project_docs"],
        transport: "http",
      },
      {
        name: "nextjs-runtime",
        reason: "No running Next.js dev server was discovered.",
        status: "unavailable",
        toolNames: [],
        transport: "stdio",
      },
    ]);

    expect(formatMcpRuntimeSummary(summary)).toContain(
      "project-docs [ready, http]"
    );
    expect(formatMcpRuntimeSummary(summary)).toContain(
      "nextjs-runtime [unavailable, stdio]: No running Next.js dev server was discovered."
    );
    expect(summary.availableTools).toEqual([
      "project__list_demos",
      "project__search_project_docs",
    ]);
  });
});
