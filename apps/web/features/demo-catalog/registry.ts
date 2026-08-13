import { customerMemoryAgentDemoMeta } from "@/features/customer-memory-agent/demo-meta";
import type {
  DemoCatalogEntry,
  DemoGalleryVisual,
  DemoPattern,
  ReadyDemoCatalogEntry,
  RoadmapDemoCatalogEntry,
} from "@/features/demo-catalog/types";
import { foundationChatDemoMeta } from "@/features/foundation-chat/demo-meta";
import { generativeUiDemoMeta } from "@/features/generative-ui/demo-meta";
import { langGraphAgentDemoMeta } from "@/features/langgraph-agent/demo-meta";
import { loopAgentDemoMeta } from "@/features/loop-agent/demo-meta";
import { mcpAgentDemoMeta } from "@/features/mcp-agent/demo-meta";
import { multimodalChatbotDemoMeta } from "@/features/multimodal-chatbot/demo-meta";
import { objectGenerationDemoMeta } from "@/features/object-generation/demo-meta";
import { openAiAgentsSdkDemoMeta } from "@/features/openai-agents-sdk-demo/demo-meta";
import { persistentAgentDemoMeta } from "@/features/persistent-agent/demo-meta";
import { ragChatbotDemoMeta } from "@/features/rag-chatbot/demo-meta";
import { sandboxAgentDemoMeta } from "@/features/sandbox-agent/demo-meta";
import { skillsAgentDemoMeta } from "@/features/skills-agent/demo-meta";
import { streamingChatShellDemoMeta } from "@/features/streaming-chat-shell/demo-meta";
import { traceEvalAgentDemoMeta } from "@/features/trace-eval-agent/demo-meta";
import { ultraChatbotAgentDemoMeta } from "@/features/ultra-chatbot-agent/demo-meta";

export const demoPatternLabels: Record<DemoPattern, string> = {
  foundation: "Foundation",
  "generative-ui": "Generative UI",
  langgraph: "LangGraph",
  loop: "Loop Agent",
  mcp: "MCP",
  multimodal: "Multimodal",
  rag: "RAG",
  sandbox: "Sandbox",
  skills: "Skills",
  "structured-output": "Structured Output",
  tools: "Tools",
};

export const demoCatalogEntries: DemoCatalogEntry[] = [
  foundationChatDemoMeta,
  ragChatbotDemoMeta,
  multimodalChatbotDemoMeta,
  objectGenerationDemoMeta,
  generativeUiDemoMeta,
  customerMemoryAgentDemoMeta,
  persistentAgentDemoMeta,
  streamingChatShellDemoMeta,
  loopAgentDemoMeta,
  langGraphAgentDemoMeta,
  skillsAgentDemoMeta,
  sandboxAgentDemoMeta,
  mcpAgentDemoMeta,
  openAiAgentsSdkDemoMeta,
  traceEvalAgentDemoMeta,
  ultraChatbotAgentDemoMeta,
];

export const readyDemoCatalogEntries: ReadyDemoCatalogEntry[] =
  demoCatalogEntries.filter(
    (entry): entry is ReadyDemoCatalogEntry => entry.status === "ready"
  );

export const roadmapDemoCatalogEntries: RoadmapDemoCatalogEntry[] =
  demoCatalogEntries.filter(
    (entry): entry is RoadmapDemoCatalogEntry => entry.status === "roadmap"
  );

export const demoGallery = demoCatalogEntries;

export const demoGalleryVisualClasses: Record<
  DemoGalleryVisual["accent"],
  {
    ascii: string;
    panel: string;
    pill: string;
  }
> = {
  amber: {
    ascii:
      "border-status-warning-500/25 bg-status-warning-500/5 text-status-warning-700 dark:text-status-warning-300",
    panel: "border-status-warning-500/20 bg-status-warning-500/10",
    pill: "bg-status-warning-500/15 text-status-warning-700",
  },
  cyan: {
    ascii:
      "border-status-info-500/25 bg-status-info-500/5 text-status-info-700 dark:text-status-info-300",
    panel: "border-status-info-500/20 bg-status-info-500/10",
    pill: "bg-status-info-500/15 text-status-info-700",
  },
  emerald: {
    ascii:
      "border-status-success-500/25 bg-status-success-500/5 text-status-success-700 dark:text-status-success-300",
    panel: "border-status-success-500/20 bg-status-success-500/10",
    pill: "bg-status-success-500/15 text-status-success-700",
  },
  indigo: {
    ascii:
      "border-status-info-500/25 bg-status-info-500/5 text-status-info-700 dark:text-status-info-300",
    panel: "border-status-info-500/20 bg-status-info-500/10",
    pill: "bg-status-info-500/15 text-status-info-700",
  },
  rose: {
    ascii:
      "border-status-danger-500/25 bg-status-danger-500/5 text-status-danger-700 dark:text-status-danger-300",
    panel: "border-status-danger-500/20 bg-status-danger-500/10",
    pill: "bg-status-danger-500/15 text-status-danger-700",
  },
  sky: {
    ascii:
      "border-status-info-500/25 bg-status-info-500/5 text-status-info-700 dark:text-status-info-300",
    panel: "border-status-info-500/20 bg-status-info-500/10",
    pill: "bg-status-info-500/15 text-status-info-700",
  },
  violet: {
    ascii:
      "border-status-info-500/25 bg-status-info-500/5 text-status-info-700 dark:text-status-info-300",
    panel: "border-status-info-500/20 bg-status-info-500/10",
    pill: "bg-status-info-500/15 text-status-info-700",
  },
};
