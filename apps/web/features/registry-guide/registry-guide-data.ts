export const registryGuideConfig = {
  catalogUrl: "https://agent-demos.hsawana9.com/r/registry.json",
  domain: "agent-demos.hsawana9.com",
  foundationChatCommand:
    "pnpm dlx shadcn@latest add @ai-sdk-6-demos/foundation-chat",
  foundationChatRoute: "/demos/foundation-chat",
  namespace: "@ai-sdk-6-demos",
  namespaceSetupCommand:
    "pnpm dlx shadcn@latest registry add @ai-sdk-6-demos=https://agent-demos.hsawana9.com/r/{name}.json",
  registryUrlTemplate: "https://agent-demos.hsawana9.com/r/{name}.json",
  sourceLinks: {
    aiElementsDocs: "https://elements.ai-sdk.dev/docs",
    aiGatewayAuthenticationDocs:
      "https://vercel.com/docs/ai-gateway/authentication",
    aiSdkDocs: "https://ai-sdk.dev/docs",
    aiSdkProviderSetup:
      "https://ai-sdk.dev/docs/getting-started/choosing-a-provider",
    githubRepo: "https://github.com/SawanaLabs/ai-sdk-6-ai-elements-demos",
    shadcnCreate: "https://ui.shadcn.com/create",
    shadcnInstallDocs: "https://ui.shadcn.com/docs/installation",
    shadcnRegistryDocs: "https://ui.shadcn.com/docs/registry",
    vercelDeploymentsDocs: "https://vercel.com/docs/deployments",
    vercelGitDeploymentsDocs: "https://vercel.com/docs/git",
  },
} as const;

export const foundationChatEnvExample = `AI_GATEWAY_API_KEY=...
AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v3/ai
AI_GATEWAY_CHAT_MODEL=openai/gpt-4.1-mini`;

export const supportedRegistryDemoNotes = [
  {
    command: "pnpm dlx shadcn@latest add @ai-sdk-6-demos/rag-chatbot",
    setup:
      "Needs DATABASE_URL, an embedding model, and a Postgres database with vector search for document indexing.",
    slug: "rag-chatbot",
    title: "RAG Chatbot",
  },
  {
    command: "pnpm dlx shadcn@latest add @ai-sdk-6-demos/multimodal-chatbot",
    setup:
      "AI Gateway only. Use a model that can process the image or PDF parts you send.",
    slug: "multimodal-chatbot",
    title: "Multimodal Chatbot",
  },
  {
    command: "pnpm dlx shadcn@latest add @ai-sdk-6-demos/object-generation",
    setup:
      "AI Gateway only. Keep the route model aligned with the structured output schema.",
    slug: "object-generation",
    title: "Object Generation",
  },
  {
    command: "pnpm dlx shadcn@latest add @ai-sdk-6-demos/customer-memory-agent",
    setup:
      "Needs DATABASE_URL for persistent threads, saved memories, and compaction checkpoints.",
    slug: "customer-memory-agent",
    title: "Memory & Persistence Agent",
  },
  {
    command: "pnpm dlx shadcn@latest add @ai-sdk-6-demos/persistent-agent",
    setup:
      "Needs DATABASE_URL and REDIS_URL for addressable chats and resumable streams.",
    slug: "persistent-agent",
    title: "Persistent Agent",
  },
  {
    command: "pnpm dlx shadcn@latest add @ai-sdk-6-demos/streaming-chat-shell",
    setup:
      "AI Gateway only. Useful as the smallest replayable streaming shell after Foundation Chat.",
    slug: "streaming-chat-shell",
    title: "Streaming Chat Shell",
  },
  {
    command: "pnpm dlx shadcn@latest add @ai-sdk-6-demos/loop-agent",
    setup:
      "AI Gateway only. Use a model with reliable tool-calling behavior for the approval loop.",
    slug: "loop-agent",
    title: "Loop Agent",
  },
  {
    command: "pnpm dlx shadcn@latest add @ai-sdk-6-demos/trace-eval-agent",
    setup:
      "AI Gateway only. It adds trace, deterministic checks, and judge output around one research run.",
    slug: "trace-eval-agent",
    title: "Trace Eval Agent",
  },
  {
    command: "pnpm dlx shadcn@latest add @ai-sdk-6-demos/sandbox-agent",
    setup:
      "Needs Vercel Sandbox credentials plus AI Gateway credentials for persistent preview sessions.",
    slug: "sandbox-agent",
    title: "Sandbox Agent",
  },
  {
    command: "pnpm dlx shadcn@latest add @ai-sdk-6-demos/skills-agent",
    setup:
      "Needs Vercel Sandbox credentials plus AI Gateway credentials for repo-local skill workspaces.",
    slug: "skills-agent",
    title: "Skills Agent",
  },
  {
    command: "pnpm dlx shadcn@latest add @ai-sdk-6-demos/mcp-agent",
    setup:
      "AI Gateway only for the base chat. Local Next.js runtime inspection depends on the installed MCP tooling.",
    slug: "mcp-agent",
    title: "MCP Agent",
  },
] as const;
