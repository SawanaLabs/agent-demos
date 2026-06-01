import { demoCatalogEntries } from "@/features/demo-catalog/registry";
import { buildRegistryAvailability } from "@/features/demo-catalog/registry-availability";
import registryManifest from "../../../../registry/registry-demos.json" with {
  type: "json",
};

const registryAvailability = buildRegistryAvailability({
  demoCatalogEntries,
  registryManifest,
});
const publicRegistryDemos = registryAvailability.publicRegistryDemos;
const mainlineRegistryDemo = registryAvailability.mainlineRegistryDemo;

function buildRegistryInstallCommand(slug: string) {
  return `pnpm dlx shadcn@latest add ${registryManifest.namespace}/${slug}`;
}

export const registryGuideConfig = {
  catalogUrl: `https://${registryManifest.productionDomain}/r/registry.json`,
  domain: registryManifest.productionDomain,
  foundationChatCommand: buildRegistryInstallCommand(mainlineRegistryDemo.slug),
  foundationChatRoute: `/demos/${mainlineRegistryDemo.slug}`,
  namespace: registryManifest.namespace,
  namespaceSetupCommand: `pnpm dlx shadcn@latest registry add ${registryManifest.namespace}=https://${registryManifest.productionDomain}/r/{name}.json`,
  registryUrlTemplate: `https://${registryManifest.productionDomain}/r/{name}.json`,
  sourceLinks: {
    aiElementsDocs: "https://elements.ai-sdk.dev/docs",
    aiGatewayAuthenticationDocs:
      "https://vercel.com/docs/ai-gateway/authentication",
    aiSdkDocs: "https://ai-sdk.dev/docs",
    aiSdkProviderSetup:
      "https://ai-sdk.dev/docs/getting-started/choosing-a-provider",
    githubRepo: "https://github.com/SawanaLabs/ai-sdk-6-ai-elements-demos",
    agentDocsSystemSkill:
      "https://github.com/multicul-silver-wolf/agent-docs-system-skill",
    mattPocockSkills: "https://github.com/mattpocock/skills",
    shadcnCreate: "https://ui.shadcn.com/create",
    shadcnInstallDocs: "https://ui.shadcn.com/docs/installation",
    shadcnRegistryDocs: "https://ui.shadcn.com/docs/registry",
    vercelDeploymentsDocs: "https://vercel.com/docs/deployments",
    vercelGitDeploymentsDocs: "https://vercel.com/docs/git",
  },
} as const;

export const registryGuideUrl = `https://${registryGuideConfig.domain}/registry-guide`;

export const registryGuideAgentTaskBrief = `I want to quickly launch a production-ready AI project from a new shadcn Next.js app.

Use this guide as the source of truth before planning:
${registryGuideUrl}

Follow the guide's new-project path: create the shadcn Next.js app, install Foundation Chat from the registry, configure the AI Gateway env, verify one local chat message, and prepare the Vercel deployment env.

Acceptance criteria:
- A new shadcn Next.js app is initialized.
- Foundation Chat is installed from @ai-sdk-6-demos.
- Local chat works with AI_GATEWAY_API_KEY.
- Vercel deployment is prepared with the same env var.`;

export const foundationChatEnvExample = `AI_GATEWAY_API_KEY=...
AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v3/ai
AI_GATEWAY_CHAT_MODEL=openai/gpt-4.1-mini`;

export const recommendedAgentSkills = [
  {
    command:
      "npx skills add https://github.com/mattpocock/skills --skill grill-with-docs",
    description:
      "Use before non-trivial changes so the agent challenges the plan against project language and captures durable decisions.",
    name: "grill-with-docs",
  },
  {
    command:
      "npx skills add https://github.com/mattpocock/skills --skill improve-codebase-architecture",
    description:
      "Run after feature work to find deeper modules, tighter interfaces, and code that is easier for agents to navigate.",
    name: "improve-codebase-architecture",
  },
  {
    command: "npx skills add https://github.com/mattpocock/skills --skill tdd",
    description:
      "Use for risky behavior changes: one failing test, one minimal implementation, then refactor while the contract stays green.",
    name: "tdd",
  },
  {
    command:
      "npx skills add https://github.com/mattpocock/skills --skill to-issues",
    description:
      "Turn a larger plan into independently shippable vertical slices that a coding agent can pick up cleanly.",
    name: "to-issues",
  },
  {
    command:
      "npx skills add https://github.com/multicul-silver-wolf/agent-docs-system-skill --skill project-docs-system",
    description:
      "Keep AGENTS.md and docs/ as project memory so future agents start from local conventions instead of rediscovering them.",
    name: "project-docs-system",
  },
] as const;

export const recommendedAgentSkillsCommand = recommendedAgentSkills
  .map((skill) => skill.command)
  .join("\n");

export const supportedRegistryDemoNotes = publicRegistryDemos
  .filter((demo) => !demo.mainline)
  .map((demo) => ({
    command: buildRegistryInstallCommand(demo.slug),
    setup: demo.setup,
    slug: demo.slug,
    title: demo.title,
  }));
