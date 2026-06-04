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
    aiSdkProviders: "https://ai-sdk.dev/providers/ai-sdk-providers",
    githubRepo: "https://github.com/SawanaLabs/agent-demos",
    agentDocsSystemSkill:
      "https://github.com/multicul-silver-wolf/agent-docs-system-skill",
    mattPocockSkills: "https://github.com/mattpocock/skills",
    shadcnCreate: "https://ui.shadcn.com/create",
    shadcnInstallDocs: "https://ui.shadcn.com/docs/installation",
    shadcnRegistryDocs: "https://ui.shadcn.com/docs/registry",
    vercelCliDeployDocs: "https://vercel.com/docs/cli/deploy",
    vercelCliDocs: "https://vercel.com/docs/cli",
    vercelCliLinkDocs: "https://vercel.com/docs/cli/link",
    vercelDeploymentsDocs: "https://vercel.com/docs/deployments",
    vercelGitDeploymentsDocs: "https://vercel.com/docs/git",
  },
} as const;

export const registryGuideUrl = `https://${registryGuideConfig.domain}/registry-guide`;

export const registryGuideAutopilotTaskBrief = `I want to quickly launch a production-ready AI project from a new shadcn Next.js app.

Use this guide as the source of truth before planning:
${registryGuideUrl}

Follow the guide's autopilot path: create the shadcn Next.js app, install Foundation Chat as the recommended starter demo from the registry, configure the default AI Gateway provider env, verify one local chat message, then use the Vercel CLI docs to link or create the Vercel project, set the production env, and trigger a deployment.

Acceptance criteria:
- A new shadcn Next.js app is initialized.
- Foundation Chat is installed from ${registryGuideConfig.namespace}.
- Local chat works with AI_GATEWAY_API_KEY.
- A Vercel deployment has been triggered.
- The deployment URL is reported.
- The deployed Foundation Chat URL is reported as <deployment-url>${registryGuideConfig.foundationChatRoute}.`;

export const registryGuideGuidedTaskBrief = `I want to launch a production-ready AI project from a new shadcn Next.js app, but I want to participate in the important setup decisions.

Use this guide as the source of truth before planning:
${registryGuideUrl}

Follow the guide's guided checkpoints path. Ask the user before each checkpoint that needs a product or account decision: shadcn Create theme choices, model provider and API key choice, whether to deploy, and final deployment acceptance.

Foundation Chat should be installed as the recommended starter demo after the shadcn project is ready. When the code reaches provider configuration, default to Vercel AI Gateway. If the user already has a provider key or prefers another provider, read the AI SDK Providers docs first, then adapt the installed Foundation Chat provider seam and env contract to that provider.

Acceptance criteria:
- The user has chosen the shadcn Create setup or provided the generated command.
- Foundation Chat is installed from ${registryGuideConfig.namespace}.
- The model provider is configured from AI Gateway or from the user's selected provider.
- Local chat works after the API key is configured.
- If the user wants deployment, a Vercel deployment is triggered and both the deployment URL and <deployment-url>${registryGuideConfig.foundationChatRoute} are reported.`;

export const registryGuideAgentTaskBrief = registryGuideAutopilotTaskBrief;

export const foundationChatEnvExample = `AI_GATEWAY_API_KEY=...
AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v3/ai
AI_GATEWAY_CHAT_MODEL=openai/gpt-4.1-mini`;

export const recommendedAgentSkills = [
  {
    command:
      "npx skills add https://github.com/mattpocock/skills --skill grill-with-docs",
    description:
      "Use before non-trivial changes so the agent challenges the plan against project language and captures durable decisions.",
    docsUrl:
      "https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md",
    name: "grill-with-docs",
  },
  {
    command:
      "npx skills add https://github.com/mattpocock/skills --skill improve-codebase-architecture",
    description:
      "Run after feature work to find deeper modules, tighter interfaces, and code that is easier for agents to navigate.",
    docsUrl:
      "https://github.com/mattpocock/skills/blob/main/skills/engineering/improve-codebase-architecture/SKILL.md",
    name: "improve-codebase-architecture",
  },
  {
    command: "npx skills add https://github.com/mattpocock/skills --skill tdd",
    description:
      "Use for risky behavior changes: one failing test, one minimal implementation, then refactor while the contract stays green.",
    docsUrl:
      "https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md",
    name: "tdd",
  },
  {
    command:
      "npx skills add https://github.com/mattpocock/skills --skill to-issues",
    description:
      "Turn a larger plan into independently shippable vertical slices that a coding agent can pick up cleanly.",
    docsUrl:
      "https://github.com/mattpocock/skills/blob/main/skills/engineering/to-issues/SKILL.md",
    name: "to-issues",
  },
  {
    command:
      "npx skills add https://github.com/multicul-silver-wolf/agent-docs-system-skill --skill project-docs-system",
    description:
      "Keep AGENTS.md and docs/ as project memory so future agents start from local conventions instead of rediscovering them.",
    docsUrl:
      "https://github.com/multicul-silver-wolf/agent-docs-system-skill/blob/main/skills/project-docs-system/SKILL.md",
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
