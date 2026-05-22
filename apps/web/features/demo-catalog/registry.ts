import type {
  DemoCatalogEntry,
  DemoPattern,
} from "@/features/demo-catalog/types";
import { foundationChatDemoMeta } from "@/features/foundation-chat/demo-meta";
import { loopAgentDemoMeta } from "@/features/loop-agent/demo-meta";
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
  streamingChatShellDemoMeta,
  loopAgentDemoMeta,
  skillsAgentDemoMeta,
  sandboxAgentDemoMeta,
];

export const readyDemoCatalogEntries = demoCatalogEntries.filter(
  (entry) => entry.status === "ready"
);

export const roadmapDemoCatalogEntries = demoCatalogEntries.filter(
  (entry) => entry.status === "roadmap"
);

export const demoGallery = demoCatalogEntries;
