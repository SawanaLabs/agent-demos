import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import {
  projectDemoPatterns,
  projectDemoStatuses,
} from "@/features/shared/project-docs-mcp/server/project-docs-catalog";
import {
  listDemoCatalogForMcp,
  readDemoDocsForMcp,
  searchProjectDocsForMcp,
} from "@/features/shared/project-docs-mcp/server/project-tools";
import { resolveProjectGuideCompanionModelId } from "../model-catalog";
import {
  createProjectGuideCompanionGateway,
  getProjectGuideCompanionConfig,
  getProjectGuideCompanionEnv,
  type ProjectGuideCompanionEnv,
} from "./env";

export const projectGuideCompanionSystemPrompt = [
  "You are the Project Guide Companion for this AI SDK 6 AI Elements demos website.",
  "Help visitors understand the project, choose demos to inspect, and find relevant implementation or docs paths.",
  "Use the project docs tools for grounded answers. Do not invent repository facts when the tools do not provide evidence.",
  "The visitor cannot directly read your MCP tool results or local repository files. You have project-docs access on their behalf, so translate retrieved evidence into the answer and use paths as citations or next steps.",
  "Keep answers concise, technical, and friendly. Mention source paths or demo titles when they matter.",
  "The visible companion history is browser-session context from the visitor and may be stale or incomplete.",
].join(" ");

function createProjectGuideCompanionTools() {
  return {
    listDemos: tool({
      description:
        "List demo catalog entries, optionally filtered by status or pattern.",
      inputSchema: z.object({
        pattern: z.enum(projectDemoPatterns).optional(),
        status: z.enum(projectDemoStatuses).optional(),
      }),
      execute: (input) => listDemoCatalogForMcp(input),
    }),
    readDemoDocs: tool({
      description:
        "Read the durable docs bundle for one demo slug, including docs/frontend and feature README when present.",
      inputSchema: z.object({
        slug: z.string().min(1),
      }),
      execute: (input) => readDemoDocsForMcp(input),
    }),
    searchProjectDocs: tool({
      description:
        "Search the project docs system for concise line-level matches.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional(),
        query: z.string().min(1),
      }),
      execute: (input) => searchProjectDocsForMcp(input),
    }),
  };
}

export async function streamProjectGuideCompanion(
  messages: UIMessage[],
  env: ProjectGuideCompanionEnv = getProjectGuideCompanionEnv(),
  selectedChatModel?: string
) {
  const gateway = createProjectGuideCompanionGateway(env);
  const { chatModel: configuredChatModel } =
    getProjectGuideCompanionConfig(env);
  const chatModel = resolveProjectGuideCompanionModelId(
    selectedChatModel ?? configuredChatModel
  );
  const result = streamText({
    messages: await convertToModelMessages(messages),
    model: gateway(chatModel),
    stopWhen: stepCountIs(8),
    system: projectGuideCompanionSystemPrompt,
    tools: createProjectGuideCompanionTools(),
  });

  return result.toUIMessageStreamResponse();
}
