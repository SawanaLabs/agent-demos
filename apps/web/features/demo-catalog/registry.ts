import { contentReviewDemoMeta } from "@/features/content-review/demo-meta";
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
import { ragChatbotDemoMeta } from "@/features/rag-chatbot/demo-meta";
import { sandboxAgentDemoMeta } from "@/features/sandbox-agent/demo-meta";
import { skillsAgentDemoMeta } from "@/features/skills-agent/demo-meta";
import { streamingChatShellDemoMeta } from "@/features/streaming-chat-shell/demo-meta";

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
  contentReviewDemoMeta,
  customerMemoryAgentDemoMeta,
  streamingChatShellDemoMeta,
  loopAgentDemoMeta,
  skillsAgentDemoMeta,
  sandboxAgentDemoMeta,
  mcpAgentDemoMeta,
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
    panel: string;
    pill: string;
    step: string;
  }
> = {
  amber: {
    panel: "border-amber-500/20 bg-amber-500/10",
    pill: "bg-amber-500/15 text-amber-700",
    step: "border-amber-500/20 bg-amber-500/5 text-amber-900",
  },
  cyan: {
    panel: "border-cyan-500/20 bg-cyan-500/10",
    pill: "bg-cyan-500/15 text-cyan-700",
    step: "border-cyan-500/20 bg-cyan-500/5 text-cyan-900",
  },
  emerald: {
    panel: "border-emerald-500/20 bg-emerald-500/10",
    pill: "bg-emerald-500/15 text-emerald-700",
    step: "border-emerald-500/20 bg-emerald-500/5 text-emerald-900",
  },
  indigo: {
    panel: "border-indigo-500/20 bg-indigo-500/10",
    pill: "bg-indigo-500/15 text-indigo-700",
    step: "border-indigo-500/20 bg-indigo-500/5 text-indigo-900",
  },
  rose: {
    panel: "border-rose-500/20 bg-rose-500/10",
    pill: "bg-rose-500/15 text-rose-700",
    step: "border-rose-500/20 bg-rose-500/5 text-rose-900",
  },
  sky: {
    panel: "border-sky-500/20 bg-sky-500/10",
    pill: "bg-sky-500/15 text-sky-700",
    step: "border-sky-500/20 bg-sky-500/5 text-sky-900",
  },
  violet: {
    panel: "border-violet-500/20 bg-violet-500/10",
    pill: "bg-violet-500/15 text-violet-700",
    step: "border-violet-500/20 bg-violet-500/5 text-violet-900",
  },
};
