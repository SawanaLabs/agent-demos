import type { DemoMetadata, DemoPattern } from "@/features/demo-catalog/types";
import { foundationChatDemoMeta } from "@/features/foundation-chat/demo-meta";

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

export const readyDemos: DemoMetadata[] = [foundationChatDemoMeta];

export const roadmapDemos: DemoMetadata[] = [
  {
    slug: "rag-chatbot",
    title: "RAG Chatbot",
    summary:
      "Knowledge-base ingestion and retrieval over durable storage, following the stable AI SDK recipe with a productized workspace.",
    pattern: "rag",
    status: "roadmap",
    source: "AI SDK 6 stable RAG recipe",
  },
  {
    slug: "loop-agent",
    title: "Loop Agent",
    summary:
      "A visible multi-step agent loop that shows tool calling, stopping rules, and the contrast between simple tools and agent control.",
    pattern: "loop",
    status: "roadmap",
    source: "AI SDK 6 tool and agent loop examples",
  },
  {
    slug: "skills-agent",
    title: "Skills Agent",
    summary:
      "A demo that composes reusable capabilities behind a single agent surface so feature-local logic can move between projects cleanly.",
    pattern: "skills",
    status: "roadmap",
    source: "Project-specific skills batch",
  },
  {
    slug: "sandbox-agent",
    title: "Sandbox Agent",
    summary:
      "A contained execution workspace for tools that need a safer runtime boundary while still feeling like a first-class product surface.",
    pattern: "sandbox",
    status: "roadmap",
    source: "Sandbox and computer-use batch",
  },
];

export const demoGallery = [...readyDemos, ...roadmapDemos];
