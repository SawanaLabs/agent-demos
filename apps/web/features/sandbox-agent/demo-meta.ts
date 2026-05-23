import type { DemoCatalogEntry } from "@/features/demo-catalog/types";

export const sandboxAgentDemoMeta: DemoCatalogEntry = {
  slug: "sandbox-agent",
  title: "Sandbox Workspace Agent",
  summary:
    "A persistent Vercel Sandbox workspace that lets the agent generate frontend files, run commands, and publish a live preview.",
  pattern: "sandbox",
  status: "ready",
  source: "Sandbox workspace and live preview batch",
};
