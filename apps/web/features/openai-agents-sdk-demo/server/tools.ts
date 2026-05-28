import {
  Agent,
  codeInterpreterTool,
  fileSearchTool,
  imageGenerationTool,
  type RunContext,
  tool,
  toolSearchTool,
  type RunItem,
  webSearchTool,
} from "@openai/agents";
import { z } from "zod";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";
import {
  getOpenAiAgentsSdkDemoToolContextNote,
  type OpenAiAgentsSdkDemoContext,
} from "./context";
import {
  getOpenAiAgentsSdkDemoChatModel,
  getOpenAiAgentsSdkDemoModelProfile,
  isOpenAiAgentsSdkDemoImageGenerationProviderBlocked,
  supportsOpenAiAgentsSdkToolSearch,
  type OpenAiAgentsSdkDemoModelProfile,
} from "./models";
import { isOpenAiAgentsSdkDemoMcpToolName } from "./mcp";
import { createOpenAiAgentsSdkDemoSandboxWorkspaceAgent } from "./sandbox";

type DemoEnv = Record<string, string | undefined>;

export type OpenAiAgentsSdkDemoToolAvailability =
  | "configured"
  | "provider-blocked"
  | "setup-required";

export type OpenAiAgentsSdkDemoToolKind =
  | "agent-as-tool"
  | "function"
  | "hosted";

export interface OpenAiAgentsSdkDemoToolCatalogEntry {
  availability: OpenAiAgentsSdkDemoToolAvailability;
  kind: OpenAiAgentsSdkDemoToolKind;
  name: string;
  notes: string;
  sdkPrimitive: string;
}

interface OpenAiAgentsSdkDemoToolCatalogOptions {
  env?: DemoEnv;
  isChatAvailable: boolean;
}

interface OpenAiAgentsSdkDemoToolOptions {
  env?: DemoEnv;
  modelProfile: OpenAiAgentsSdkDemoModelProfile;
}

const buildResearchBriefInput = z.object({
  company: z.string().min(1),
  focus: z.string().min(1).optional(),
});
const researchFollowUpInput = z.object({
  company: z.string().min(1),
  focus: z.string().min(1).optional(),
});
const riskWatchlistInput = z.object({
  company: z.string().min(1),
  thesis: z.string().min(1).optional(),
});
const publishResearchSummaryInput = z.object({
  audience: z.string().min(1),
  company: z.string().min(1),
  summary: z.string().min(1),
});

function getOpenAiAgentsSdkDemoVectorStoreIds(env: DemoEnv = process.env) {
  const configuredIds = env.OPENAI_AGENTS_VECTOR_STORE_IDS;

  if (!configuredIds) {
    return [];
  }

  return Array.from(
    new Set(
      configuredIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

function createBuildResearchBriefTool() {
  return tool({
    description:
      "Create a compact public-company investment research brief before deeper financial analysis.",
    execute: (
      { company, focus },
      runContext?: RunContext<OpenAiAgentsSdkDemoContext>,
    ) => {
      const researchFocus = focus?.trim() || "overall business quality";
      const contextNote = getOpenAiAgentsSdkDemoToolContextNote(runContext);

      return [
        `Company: ${company}`,
        `Focus: ${researchFocus}`,
        "Research brief:",
        "- Start with the latest filings, earnings material, and management commentary.",
        "- Confirm current facts with web search before citing them.",
        "- Use code interpreter for tables, growth rates, scenario math, or valuation support.",
        "- Separate business quality, financial performance, capital allocation, and key risks.",
        ...(contextNote ? [contextNote] : []),
      ].join("\n");
    },
    name: "build_research_brief",
    parameters: buildResearchBriefInput,
  });
}

function createDraftFinancialFollowUpTool() {
  return tool({
    deferLoading: true,
    description:
      "Draft follow-up financial questions for a public-company research task.",
    execute: ({ company, focus }) => {
      const researchFocus = focus?.trim() || "growth quality";

      return [
        `Company: ${company}`,
        `Focus: ${researchFocus}`,
        "Follow-up questions:",
        "- Which revenue or margin drivers matter most in the next 2 to 4 quarters?",
        "- Which line items need model-backed validation before citing a conclusion?",
        "- Which management claims need fresh evidence from filings, earnings calls, or product updates?",
      ].join("\n");
    },
    name: "draft_financial_follow_up",
    parameters: researchFollowUpInput,
  });
}

function createBuildRiskWatchlistTool() {
  return tool({
    deferLoading: true,
    description:
      "Build a compact risk watchlist for a public-company research thesis.",
    execute: ({ company, thesis }) => {
      const thesisSummary = thesis?.trim() || "the current research thesis";

      return [
        `Company: ${company}`,
        `Thesis: ${thesisSummary}`,
        "Risk watchlist:",
        "- Demand and pricing pressure",
        "- Execution risk across new products, production, or go-to-market changes",
        "- Regulatory, legal, or capital-allocation surprises",
        "- Facts that still need direct source confirmation before memo sign-off",
      ].join("\n");
    },
    name: "build_risk_watchlist",
    parameters: riskWatchlistInput,
  });
}

function createPublishResearchSummaryTool() {
  return tool({
    description:
      "Publish a finished research takeaway to an external audience after a human approval checkpoint.",
    execute: ({ audience, company, summary }) =>
      [
        `Audience: ${audience}`,
        `Company: ${company}`,
        "Status: approved and ready to share.",
        `Summary: ${summary}`,
      ].join("\n"),
    name: "publish_research_summary",
    needsApproval: true,
    parameters: publishResearchSummaryInput,
  });
}

function createResearchMemoAgentTool({
  modelProfile,
}: OpenAiAgentsSdkDemoToolOptions) {
  const memoAgent = new Agent<OpenAiAgentsSdkDemoContext>({
    instructions: (runContext) => {
      const toolInputPreview =
        runContext.toolInput && typeof runContext.toolInput === "object"
          ? JSON.stringify(runContext.toolInput)
          : null;

      return [
        "You turn collected research notes into a concise investment-research memo with claims, evidence, risks, and open questions.",
        `Current demo run mode: ${runContext.context.researchMode}.`,
        `Default research target when unspecified: ${runContext.context.defaultResearchTarget}.`,
        ...(toolInputPreview
          ? [`Current agent.asTool input: ${toolInputPreview}.`]
          : []),
      ].join(" ");
    },
    model: modelProfile.model,
    modelSettings: {
      reasoning: {
        effort: modelProfile.reasoningEffort,
      },
      text: {
        verbosity: modelProfile.textVerbosity,
      },
    },
    name: "Research Memo Agent",
  });

  return memoAgent.asTool({
    toolDescription:
      "Synthesize gathered research into a compact memo with evidence, risks, and follow-up questions.",
    toolName: "research_memo_agent",
  });
}

function createSandboxWorkspaceAgentTool({
  modelProfile,
}: OpenAiAgentsSdkDemoToolOptions) {
  const sandboxAgent = createOpenAiAgentsSdkDemoSandboxWorkspaceAgent({
    modelProfile,
  });

  return sandboxAgent.asTool({
    toolDescription:
      "Inspect the mounted demo docs and feature slice inside a sandboxed workspace with filesystem and shell tools.",
    toolName: "sandbox_workspace_agent",
  });
}

export function createOpenAiAgentsSdkDemoTools({
  env = process.env,
  modelProfile,
}: OpenAiAgentsSdkDemoToolOptions) {
  const vectorStoreIds = getOpenAiAgentsSdkDemoVectorStoreIds(env);
  const supportsToolSearch = supportsOpenAiAgentsSdkToolSearch(
    modelProfile.model,
  );

  return [
    createBuildResearchBriefTool(),
    createPublishResearchSummaryTool(),
    ...(supportsToolSearch
      ? [createDraftFinancialFollowUpTool(), createBuildRiskWatchlistTool()]
      : []),
    webSearchTool({
      searchContextSize: "medium",
    }),
    ...(vectorStoreIds.length > 0
      ? [
          fileSearchTool(vectorStoreIds, {
            includeSearchResults: true,
            maxNumResults: 3,
          }),
        ]
      : []),
    codeInterpreterTool({
      includeOutputs: true,
    }),
    imageGenerationTool({
      size: "1024x1024",
    }),
    ...(supportsToolSearch ? [toolSearchTool()] : []),
    createResearchMemoAgentTool({
      modelProfile,
    }),
    createSandboxWorkspaceAgentTool({
      modelProfile,
    }),
  ];
}

export function getOpenAiAgentsSdkDemoToolCatalog({
  env = process.env,
  isChatAvailable,
}: OpenAiAgentsSdkDemoToolCatalogOptions): OpenAiAgentsSdkDemoToolCatalogEntry[] {
  const modelProfile = getOpenAiAgentsSdkDemoModelProfile(env);
  const supportsToolSearch = supportsOpenAiAgentsSdkToolSearch(
    getOpenAiAgentsSdkDemoChatModel(env),
  );
  const hasFileSearchSetup =
    getOpenAiAgentsSdkDemoVectorStoreIds(env).length > 0 && isChatAvailable;
  const isImageGenerationProviderBlocked =
    isOpenAiAgentsSdkDemoImageGenerationProviderBlocked(modelProfile) &&
    isChatAvailable;
  const functionToolContinuationNote =
    modelProfile.baseUrl.includes("ai-gateway.vercel.sh") && isChatAvailable
      ? " The current AI Gateway path can reject the SDK's default run_llm_again continuation after local function tools; the demo surfaces that provider error instead of injecting a fake final answer."
      : "";
  const availability: OpenAiAgentsSdkDemoToolAvailability = isChatAvailable
    ? "configured"
    : "setup-required";
  const deferredToolAvailability: OpenAiAgentsSdkDemoToolAvailability =
    supportsToolSearch && isChatAvailable ? "configured" : "setup-required";

  return [
    {
      availability,
      kind: "function",
      name: "build_research_brief",
      notes: `Thin official tool() example for the Tesla-style research flow.${functionToolContinuationNote}`,
      sdkPrimitive: "tool()",
    },
    {
      availability,
      kind: "function",
      name: "publish_research_summary",
      notes: `Official tool({ needsApproval: true }) path for a human approval interruption before sharing research externally.${functionToolContinuationNote}`,
      sdkPrimitive: "tool({ needsApproval: true })",
    },
    {
      availability: deferredToolAvailability,
      kind: "function",
      name: "draft_financial_follow_up",
      notes: supportsToolSearch
        ? "Deferred top-level function tool loaded on demand through the official tool search flow."
        : "Requires an OpenAI Responses model with tool_search support, such as openai/gpt-5.4-mini or newer.",
      sdkPrimitive: "tool({ deferLoading: true })",
    },
    {
      availability: deferredToolAvailability,
      kind: "function",
      name: "build_risk_watchlist",
      notes: supportsToolSearch
        ? "Deferred top-level function tool loaded on demand through the official tool search flow."
        : "Requires an OpenAI Responses model with tool_search support, such as openai/gpt-5.4-mini or newer.",
      sdkPrimitive: "tool({ deferLoading: true })",
    },
    {
      availability,
      kind: "hosted",
      name: "web_search",
      notes:
        "Hosted OpenAI search through the current AI Gateway OpenAI-compatible Responses path.",
      sdkPrimitive: "webSearchTool()",
    },
    {
      availability,
      kind: "hosted",
      name: "code_interpreter",
      notes:
        "Hosted OpenAI code interpreter for math, tables, and quick analysis.",
      sdkPrimitive: "codeInterpreterTool()",
    },
    {
      availability,
      kind: "agent-as-tool",
      name: "research_memo_agent",
      notes:
        "Specialist sub-agent exposed through agent.asTool() for memo synthesis.",
      sdkPrimitive: "agent.asTool()",
    },
    {
      availability,
      kind: "agent-as-tool",
      name: "sandbox_workspace_agent",
      notes:
        "Official SandboxAgent specialist mounted over the demo docs and feature slice, then exposed through agent.asTool().",
      sdkPrimitive: "SandboxAgent.asTool()",
    },
    {
      availability: hasFileSearchSetup ? "configured" : "setup-required",
      kind: "hosted",
      name: "file_search",
      notes: hasFileSearchSetup
        ? "Official hosted file search backed by OPENAI_AGENTS_VECTOR_STORE_IDS."
        : "Set OPENAI_AGENTS_VECTOR_STORE_IDS to one or more comma-separated OpenAI vector store ids.",
      sdkPrimitive: "fileSearchTool()",
    },
    {
      availability: isImageGenerationProviderBlocked
        ? "provider-blocked"
        : availability,
      kind: "hosted",
      name: "image_generation",
      notes: isImageGenerationProviderBlocked
        ? "Registered through imageGenerationTool(), but blocked on the current AI Gateway Responses path. The hosted image tool can complete without a renderable image artifact, and streamed runs can terminate before the AI SDK UI bridge receives a usable file part."
        : "Official hosted image generation with assistant file output rendered in the current chat surface.",
      sdkPrimitive: "imageGenerationTool()",
    },
    {
      availability: deferredToolAvailability,
      kind: "hosted",
      name: "tool_search",
      notes: supportsToolSearch
        ? "Official hosted tool search for loading deferred namespace members on demand."
        : "Requires an OpenAI Responses model with tool_search support, such as openai/gpt-5.4-mini or newer.",
      sdkPrimitive: "toolSearchTool()",
    },
  ];
}

function getToolName(rawItem: { name?: string; type?: string }): string | null {
  if (
    rawItem.type === "function_call" ||
    rawItem.type === "function_call_result" ||
    rawItem.type === "hosted_tool_call"
  ) {
    if (!rawItem.name) {
      return null;
    }

    if (rawItem.type === "hosted_tool_call" && rawItem.name.endsWith("_call")) {
      return rawItem.name.slice(0, -"_call".length);
    }

    return rawItem.name;
  }

  if (
    rawItem.type === "tool_search_call" ||
    rawItem.type === "tool_search_output"
  ) {
    return "tool_search";
  }

  if (rawItem.type === "image_generation_call") {
    return "image_generation";
  }

  return null;
}

export function getOpenAiAgentsSdkDemoRunUsageMetadata(
  newItems: RunItem[],
): OpenAiAgentsSdkDemoMessageMetadata | undefined {
  const usedToolNames = Array.from(
    new Set(
      newItems
        .map((item) =>
          getToolName((item.rawItem ?? {}) as { name?: string; type?: string }),
        )
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (usedToolNames.length === 0) {
    return undefined;
  }

  const usedGuideIds = ["tools"];

  if (usedToolNames.includes("research_memo_agent")) {
    usedGuideIds.push("agent-orchestration");
  }

  if (usedToolNames.some((name) => isOpenAiAgentsSdkDemoMcpToolName(name))) {
    usedGuideIds.push("mcp");
  }

  return {
    usedGuideIds,
    usedToolNames,
  };
}
