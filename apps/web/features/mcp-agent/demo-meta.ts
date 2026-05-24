import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const mcpAgentDemoMeta: DemoCatalogEntry = {
  galleryVisual: {
    accent: "cyan",
    label: "Runtime doctor",
    steps: ["Discover", "Inspect", "Answer"],
  },
  slug: "mcp-agent",
  title: "MCP Runtime Doctor Agent",
  summary:
    "An AI SDK ToolLoopAgent that discovers MCP tools from project docs and a local Next.js runtime, then answers repo and runtime questions through namespaced tool calls.",
  pattern: "mcp",
  status: "ready",
  href: "/demos/mcp-agent",
  source: "AI SDK MCP tools and Next.js dev MCP guide",
};
