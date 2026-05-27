import { objectGenerationDemoMeta } from "@/features/object-generation/demo-meta";
import { customerMemoryAgentDemoMeta } from "@/features/customer-memory-agent/demo-meta";
import type {
  DemoCatalogEntry,
  DemoGalleryVisual,
  DemoPattern,
  ReadyDemoCatalogEntry,
  RoadmapDemoCatalogEntry,
} from "@/features/demo-catalog/types";
import { foundationChatDemoMeta } from "@/features/foundation-chat/demo-meta";
import { loopAgentDemoMeta } from "@/features/loop-agent/demo-meta";
import { mcpAgentDemoMeta } from "@/features/mcp-agent/demo-meta";
import { multimodalChatbotDemoMeta } from "@/features/multimodal-chatbot/demo-meta";
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
  customerMemoryAgentDemoMeta,
  persistentAgentDemoMeta,
  streamingChatShellDemoMeta,
  loopAgentDemoMeta,
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
      "border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300",
    panel: "border-amber-500/20 bg-amber-500/10",
    pill: "bg-amber-500/15 text-amber-700",
  },
  cyan: {
    ascii: "border-cyan-500/25 bg-cyan-500/5 text-cyan-700 dark:text-cyan-300",
    panel: "border-cyan-500/20 bg-cyan-500/10",
    pill: "bg-cyan-500/15 text-cyan-700",
  },
  emerald: {
    ascii:
      "border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
    panel: "border-emerald-500/20 bg-emerald-500/10",
    pill: "bg-emerald-500/15 text-emerald-700",
  },
  indigo: {
    ascii:
      "border-indigo-500/25 bg-indigo-500/5 text-indigo-700 dark:text-indigo-300",
    panel: "border-indigo-500/20 bg-indigo-500/10",
    pill: "bg-indigo-500/15 text-indigo-700",
  },
  rose: {
    ascii: "border-rose-500/25 bg-rose-500/5 text-rose-700 dark:text-rose-300",
    panel: "border-rose-500/20 bg-rose-500/10",
    pill: "bg-rose-500/15 text-rose-700",
  },
  sky: {
    ascii: "border-sky-500/25 bg-sky-500/5 text-sky-700 dark:text-sky-300",
    panel: "border-sky-500/20 bg-sky-500/10",
    pill: "bg-sky-500/15 text-sky-700",
  },
  violet: {
    ascii:
      "border-violet-500/25 bg-violet-500/5 text-violet-700 dark:text-violet-300",
    panel: "border-violet-500/20 bg-violet-500/10",
    pill: "bg-violet-500/15 text-violet-700",
  },
};
