import {
  OpenIn,
  OpenInChatGPT,
  OpenInClaude,
  OpenInContent,
  OpenInCursor,
  OpenInScira,
  OpenInT3,
  OpenInTrigger,
  OpenInv0,
} from "@workspace/ui/components/ai-elements/open-in-chat";
import { Badge } from "@workspace/ui/components/badge";
import { buttonVariants } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowLeft, ArrowUpRight, ChevronDown, Terminal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageText } from "@/components/page-copy";
import { RegistryCopyButton } from "@/features/registry-guide/registry-copy-button";
import {
  foundationChatEnvExample,
  recommendedAgentSkills,
  recommendedAgentSkillsCommand,
  registryGuideAutopilotTaskBrief,
  registryGuideConfig,
  registryGuideGuidedTaskBrief,
  supportedRegistryDemoNotes,
} from "@/features/registry-guide/registry-guide-data";
import { RegistrySmoothScroll } from "@/features/registry-guide/registry-smooth-scroll";

const quickInstallCommand = `${registryGuideConfig.namespaceSetupCommand}
${registryGuideConfig.foundationChatCommand}`;

export const metadata: Metadata = {
  description:
    "Create a shadcn Next.js app, install a recommended Agent Demo through the public registry, configure a model provider, run it locally, and deploy with Vercel.",
  title: "shadcn Registry Guide | Agent Demos",
};

function ExternalLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      className="inline-flex items-baseline gap-1 text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
      <ArrowUpRight className="size-3 translate-y-0.5" />
    </Link>
  );
}

function OpenAgentBriefInChatButton({ query }: { query: string }) {
  return (
    <OpenIn query={query}>
      <OpenInTrigger
        className={cn(
          buttonVariants({ size: "xs", variant: "outline" }),
          "bg-background"
        )}
        type="button"
      >
        <PageText>{"Open in chat"}</PageText>
        <ChevronDown className="size-3" />
      </OpenInTrigger>
      <OpenInContent align="end">
        <OpenInChatGPT />
        <OpenInClaude />
        <OpenInT3 />
        <OpenInScira />
        <OpenInv0 />
        <OpenInCursor />
      </OpenInContent>
    </OpenIn>
  );
}

function GuideCommandPanel({
  actions,
  code,
  title,
}: {
  actions?: ReactNode;
  code: string;
  title: string;
}) {
  return (
    <div className="min-w-0 max-w-full overflow-hidden border border-foreground/10 bg-background">
      <div className="flex min-w-0 flex-col gap-2 border-b bg-muted/80 px-3 py-2 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Terminal className="size-3.5 shrink-0" />
          <span className="truncate font-mono">{title}</span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-1 sm:shrink-0">
          {actions}
          <RegistryCopyButton value={code} />
        </div>
      </div>
      <pre className="m-0 overflow-x-auto whitespace-pre-wrap break-words p-3 font-mono text-foreground text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function RequirementCard({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Card className="h-full border-foreground/10" size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs/relaxed">{children}</p>
      </CardContent>
    </Card>
  );
}

function DemoCommandBlock({ command }: { command: string }) {
  return (
    <div className="flex items-start gap-2 border border-foreground/10 bg-muted/40 p-2">
      <code className="min-w-0 flex-1 break-all font-mono text-[11px] text-foreground leading-relaxed">
        {command}
      </code>
      <RegistryCopyButton value={command} />
    </div>
  );
}

function AgentSkillCard({
  description,
  docsUrl,
  name,
}: {
  description: string;
  docsUrl: string;
  name: string;
}) {
  return (
    <Link
      aria-label={`Open ${name} SKILL.md on GitHub`}
      className="group block h-full outline-none"
      href={docsUrl}
      rel="noreferrer"
      target="_blank"
    >
      <Card
        className="h-full border-foreground/10 transition-colors group-hover:border-foreground/30 group-focus-visible:border-ring group-focus-visible:ring-1 group-focus-visible:ring-ring/50"
        size="sm"
      >
        <CardHeader>
          <CardTitle className="flex items-start justify-between gap-2">
            <span>{name}</span>
            <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs/relaxed">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function RegistryGuidePage() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <RegistrySmoothScroll />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        <section className="space-y-5 border border-foreground/10 bg-background px-4 py-5">
          <Link
            className="inline-flex items-center gap-2 text-muted-foreground text-xs hover:text-foreground"
            href="/"
          >
            <ArrowLeft className="size-3.5" />
            <PageText>{"Back to demos"}</PageText>
          </Link>
          <div className="space-y-3">
            <Badge variant="outline">
              <PageText>{"Public registry guide"}</PageText>
            </Badge>
            <h1 className="max-w-5xl font-medium text-3xl tracking-tight md:text-4xl">
              <PageText>
                {"Give Codex a launch path for your agent app"}
              </PageText>
            </h1>
            <p className="max-w-4xl text-muted-foreground text-sm/relaxed">
              <PageText>
                {
                  "Start from shadcn Create, install a production-ready Agent Demo slice through the registry, configure a provider, verify locally, and deploy. Use Foundation Chat for the fastest path, or choose the slice that matches your agent scenario. The source lives in the"
                }
              </PageText>
              <PageText> </PageText>
              <ExternalLink href={registryGuideConfig.sourceLinks.githubRepo}>
                <PageText>{"GitHub repository"}</PageText>
              </ExternalLink>
              <PageText>{"; the demo install follows the public"}</PageText>
              <PageText> </PageText>
              <ExternalLink
                href={registryGuideConfig.sourceLinks.shadcnRegistryDocs}
              >
                <PageText>{"shadcn registry"}</PageText>
              </ExternalLink>
              <PageText> </PageText>
              <PageText>{"namespace flow."}</PageText>
            </p>
            <div className="flex max-w-4xl flex-col gap-2 border border-foreground/10 bg-muted/40 p-3 sm:flex-row sm:items-start">
              <Badge className="shrink-0" variant="outline">
                <PageText>{"Agent note"}</PageText>
              </Badge>
              <p className="text-muted-foreground text-xs/relaxed">
                <PageText>
                  {
                    "Before starting, ask the user whether they want the autopilot path or guided checkpoints. Do not assume the mode."
                  }
                </PageText>
              </p>
            </div>
            <p className="max-w-4xl text-muted-foreground text-sm/relaxed">
              <PageText>{"Start by creating a styled project in"}</PageText>
              <PageText> </PageText>
              <ExternalLink href={registryGuideConfig.sourceLinks.shadcnCreate}>
                <PageText>{"shadcn Create"}</PageText>
              </ExternalLink>
              <PageText>
                {
                  ". Then add Foundation Chat as the recommended starter demo. It is the smallest production-ready slice of this repo's"
                }
              </PageText>
              <PageText> </PageText>
              <ExternalLink href={registryGuideConfig.sourceLinks.aiSdkDocs}>
                <PageText>{"AI SDK"}</PageText>
              </ExternalLink>
              <PageText> </PageText>
              <PageText>{"plus"}</PageText>
              <PageText> </PageText>
              <ExternalLink
                href={registryGuideConfig.sourceLinks.aiElementsDocs}
              >
                <PageText>{"AI Elements"}</PageText>
              </ExternalLink>
              <PageText> </PageText>
              <PageText>
                {
                  "stack: one chat page, one API route, and the required AI Gateway env vars. If the provider choice changes after installation, use the"
                }
              </PageText>
              <PageText> </PageText>
              <ExternalLink
                href={registryGuideConfig.sourceLinks.aiSdkProviders}
              >
                <PageText>{"AI SDK Providers"}</PageText>
              </ExternalLink>
              <PageText> </PageText>
              <PageText>
                {
                  "docs as the reference before adapting the installed provider seam."
                }
              </PageText>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className={cn(buttonVariants({ size: "sm" }))}
              href="#install"
            >
              <PageText>{"Quick install"}</PageText>
            </Link>
            <Link
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              href="#agent-paths"
            >
              <PageText>{"Agent paths"}</PageText>
            </Link>
            <Link
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              href="#next-steps"
            >
              <PageText>{"Full paths"}</PageText>
            </Link>
          </div>
        </section>

        <section
          className="grid gap-5 border border-foreground/10 bg-background p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
          id="install"
        >
          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
              <PageText>{"Quick point"}</PageText>
            </p>
            <h2 className="font-medium text-2xl tracking-tight">
              <PageText>{"Install the recommended starter demo"}</PageText>
            </h2>
            <p className="text-muted-foreground text-sm/relaxed">
              <PageText>
                {
                  "Foundation Chat is the smallest production-ready starting point: it drops a working chat page, API route, AI Elements UI, and AI SDK runtime wiring into the app you created."
                }
              </PageText>
            </p>
          </div>

          <GuideCommandPanel code={quickInstallCommand} title="quick install" />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <RequirementCard title="Create a shadcn project">
            <PageText>{"Use"}</PageText>
            <PageText> </PageText>
            <ExternalLink href={registryGuideConfig.sourceLinks.shadcnCreate}>
              <PageText>{"shadcn Create"}</PageText>
            </ExternalLink>
            <PageText> </PageText>
            <PageText>
              {
                "to choose Next.js, pick a theme, and run the generated command in the new project folder."
              }
            </PageText>
          </RequirementCard>
          <RequirementCard title="Configure a provider">
            <PageText>{"The default path uses"}</PageText>
            <PageText> </PageText>
            <ExternalLink
              href={registryGuideConfig.sourceLinks.aiGatewayAuthenticationDocs}
            >
              <PageText>{"AI Gateway"}</PageText>
            </ExternalLink>
            <PageText>
              {
                ". If you already have another provider key, ask your agent to start from"
              }
            </PageText>
            <PageText> </PageText>
            <ExternalLink href={registryGuideConfig.sourceLinks.aiSdkProviders}>
              <PageText>{"AI SDK Providers"}</PageText>
            </ExternalLink>
            <PageText> </PageText>
            <PageText>
              {"before changing the installed provider seam."}
            </PageText>
          </RequirementCard>
          <RequirementCard title="Deploy with CLI">
            <PageText>{"Use the"}</PageText>
            <PageText> </PageText>
            <ExternalLink href={registryGuideConfig.sourceLinks.vercelCliDocs}>
              <PageText>{"Vercel CLI docs"}</PageText>
            </ExternalLink>
            <PageText> </PageText>
            <PageText>
              {
                "to link or create the project, set the required provider env vars, trigger a deployment, and report both the deployment URL and the Foundation Chat page URL."
              }
            </PageText>
          </RequirementCard>
        </section>

        <section
          className="space-y-4 border-foreground/10 border-t pt-8"
          id="agent-paths"
        >
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
              <PageText>{"Coding agents"}</PageText>
            </p>
            <h2 className="font-medium text-xl">
              <PageText>{"Choose how your agent should operate"}</PageText>
            </h2>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              <PageText>
                {
                  "Both task briefs point the agent back to this guide as the source of truth. Before any setup starts, the agent should ask the user to choose a mode. Use autopilot for the fastest autonomous path, or use guided checkpoints when the user wants the agent to ask before theme, provider, API key, and deployment decisions."
                }
              </PageText>
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">
                <PageText>{"Autopilot task brief"}</PageText>
              </h3>
              <p className="text-muted-foreground text-xs/relaxed">
                <PageText>
                  {
                    "Let the agent create the app, install the recommended starter demo, configure the default provider, verify locally, and complete the Vercel deployment."
                  }
                </PageText>
              </p>
              <GuideCommandPanel
                actions={
                  <OpenAgentBriefInChatButton
                    query={registryGuideAutopilotTaskBrief}
                  />
                }
                code={registryGuideAutopilotTaskBrief}
                title="autopilot task brief"
              />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm">
                <PageText>{"Guided checkpoints task brief"}</PageText>
              </h3>
              <p className="text-muted-foreground text-xs/relaxed">
                <PageText>
                  {
                    "Keep the same setup path, but require the agent to pause for shadcn Create choices, provider selection, API key setup, and deployment approval."
                  }
                </PageText>
              </p>
              <GuideCommandPanel
                actions={
                  <OpenAgentBriefInChatButton
                    query={registryGuideGuidedTaskBrief}
                  />
                }
                code={registryGuideGuidedTaskBrief}
                title="guided checkpoints task brief"
              />
            </div>
          </div>
        </section>

        <section
          className="space-y-6 border-foreground/10 border-t pt-8"
          id="next-steps"
        >
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
              <PageText>{"Full paths"}</PageText>
            </p>
            <h2 className="font-medium text-xl">
              <PageText>{"Pick the level of human involvement"}</PageText>
            </h2>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              <PageText>
                {
                  "Both paths start from shadcn Create, install Foundation Chat as the recommended starter demo, verify a local chat turn, and finish with deployment acceptance when Vercel is in scope."
                }
              </PageText>
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5 border border-foreground/10 p-4">
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                  <PageText>{"Autopilot full path"}</PageText>
                </p>
                <h3 className="font-medium text-lg">
                  <PageText>{"Let the agent keep moving"}</PageText>
                </h3>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "Use this path when the goal is speed. The agent creates the project, installs the recommended starter demo, configures the default provider, verifies locally, then uses Vercel's CLI docs to deploy and report the result."
                    }
                  </PageText>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  <PageText>{"1. Create the shadcn Next.js app"}</PageText>
                </h4>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>{"Start from"}</PageText>
                  <PageText> </PageText>
                  <ExternalLink
                    href={registryGuideConfig.sourceLinks.shadcnCreate}
                  >
                    <PageText>{"shadcn Create"}</PageText>
                  </ExternalLink>
                  <PageText> </PageText>
                  <PageText>{"or the official"}</PageText>
                  <PageText> </PageText>
                  <ExternalLink
                    href={registryGuideConfig.sourceLinks.shadcnInstallDocs}
                  >
                    <PageText>{"installation docs"}</PageText>
                  </ExternalLink>
                  <PageText>
                    {
                      ". The created app should already have shadcn/ui configured before any registry item is added."
                    }
                  </PageText>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  <PageText>
                    {"2. Install the recommended starter demo"}
                  </PageText>
                </h4>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "Register the Agent Demos namespace, then add Foundation Chat from the registry. This copies the page route, API route, UI, provider env seam, and runtime helper into the new app."
                    }
                  </PageText>
                </p>
                <GuideCommandPanel
                  code={quickInstallCommand}
                  title="recommended starter install"
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  <PageText>
                    {"3. Configure the default provider and verify locally"}
                  </PageText>
                </h4>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>{"Default to"}</PageText>
                  <PageText> </PageText>
                  <ExternalLink
                    href={
                      registryGuideConfig.sourceLinks
                        .aiGatewayAuthenticationDocs
                    }
                  >
                    <PageText>{"AI Gateway authentication"}</PageText>
                  </ExternalLink>
                  <PageText>
                    {
                      ", add the env vars, run the app, and send one message on "
                    }
                  </PageText>
                  <code className="font-mono text-foreground">
                    {registryGuideConfig.foundationChatRoute}
                  </code>
                  <PageText>
                    {
                      ". If the user already supplied a provider preference before the run began, read"
                    }
                  </PageText>
                  <PageText> </PageText>
                  <ExternalLink
                    href={registryGuideConfig.sourceLinks.aiSdkProviders}
                  >
                    <PageText>{"AI SDK Providers"}</PageText>
                  </ExternalLink>
                  <PageText> </PageText>
                  <PageText>
                    {"before adapting the installed provider seam."}
                  </PageText>
                </p>
                <GuideCommandPanel
                  code={foundationChatEnvExample}
                  title=".env.local"
                />
                <GuideCommandPanel
                  code={`pnpm dev
# open http://localhost:3000${registryGuideConfig.foundationChatRoute}`}
                  title="run and open"
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  <PageText>{"4. Deploy and report the working URLs"}</PageText>
                </h4>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>{"Use the"}</PageText>
                  <PageText> </PageText>
                  <ExternalLink
                    href={registryGuideConfig.sourceLinks.vercelCliDocs}
                  >
                    <PageText>{"Vercel CLI docs"}</PageText>
                  </ExternalLink>
                  <PageText> </PageText>
                  <PageText>{"plus the"}</PageText>
                  <PageText> </PageText>
                  <ExternalLink
                    href={registryGuideConfig.sourceLinks.vercelCliLinkDocs}
                  >
                    <PageText>{"link"}</PageText>
                  </ExternalLink>
                  <PageText> </PageText>
                  <PageText>{"and"}</PageText>
                  <PageText> </PageText>
                  <ExternalLink
                    href={registryGuideConfig.sourceLinks.vercelCliDeployDocs}
                  >
                    <PageText>{"deploy"}</PageText>
                  </ExternalLink>
                  <PageText> </PageText>
                  <PageText>
                    {
                      "references. The acceptance result is a real deployment URL and the full Foundation Chat page URL at"
                    }
                  </PageText>
                  <PageText> </PageText>
                  <code className="font-mono text-foreground">
                    {"<deployment-url>"}
                    {registryGuideConfig.foundationChatRoute}
                  </code>
                  .
                </p>
              </div>
            </div>

            <div className="space-y-5 border border-foreground/10 p-4">
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                  <PageText>{"Guided checkpoints full path"}</PageText>
                </p>
                <h3 className="font-medium text-lg">
                  <PageText>{"Keep the user in the loop"}</PageText>
                </h3>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "Use this path when the user wants to learn the stack or make account and provider choices directly. The agent should pause at each checkpoint before making the next setup decision."
                    }
                  </PageText>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  <PageText>{"1. shadcn Create checkpoint"}</PageText>
                </h4>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>{"Ask the user to open"}</PageText>
                  <PageText> </PageText>
                  <ExternalLink
                    href={registryGuideConfig.sourceLinks.shadcnCreate}
                  >
                    <PageText>{"shadcn Create"}</PageText>
                  </ExternalLink>
                  <PageText>
                    {
                      ". The user chooses the style, color, radius, and project shape, then gives the generated command back to the agent. The agent can run that command and continue from the created project folder."
                    }
                  </PageText>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  <PageText>{"2. Registry starter checkpoint"}</PageText>
                </h4>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "After the shadcn project exists, install Foundation Chat as the recommended starter demo. This confirms the registry namespace, route placement, AI Elements UI, and runtime wiring before deeper project adaptation begins."
                    }
                  </PageText>
                </p>
                <GuideCommandPanel
                  code={quickInstallCommand}
                  title="recommended starter install"
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  <PageText>{"3. Provider and API key checkpoint"}</PageText>
                </h4>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "Once the code is installed, ask whether to continue with the default AI Gateway setup or use a provider key the user already has, such as Moonshot, DeepSeek, or MiniMax. If the provider changes, read"
                    }
                  </PageText>
                  <PageText> </PageText>
                  <ExternalLink
                    href={registryGuideConfig.sourceLinks.aiSdkProviders}
                  >
                    <PageText>{"AI SDK Providers"}</PageText>
                  </ExternalLink>
                  <PageText> </PageText>
                  <PageText>
                    {
                      "first, install the documented provider package, then adapt the installed Foundation Chat provider seam and env contract."
                    }
                  </PageText>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  <PageText>{"4. Local completion checkpoint"}</PageText>
                </h4>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "Treat local setup as complete only after the selected provider key is configured, the dev server starts, and"
                    }
                  </PageText>
                  <PageText> </PageText>
                  <code className="font-mono text-foreground">
                    {registryGuideConfig.foundationChatRoute}
                  </code>
                  <PageText> </PageText>
                  <PageText>
                    {"returns one visible assistant response."}
                  </PageText>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  <PageText>{"5. Deployment checkpoint"}</PageText>
                </h4>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "Ask whether the user wants to deploy now. If yes, follow the"
                    }
                  </PageText>
                  <PageText> </PageText>
                  <ExternalLink
                    href={registryGuideConfig.sourceLinks.vercelCliDocs}
                  >
                    <PageText>{"Vercel CLI docs"}</PageText>
                  </ExternalLink>
                  <PageText>
                    {
                      ". Link or create the project, set the required production env vars, trigger a deployment, then report the deployment URL and"
                    }
                  </PageText>
                  <PageText> </PageText>
                  <code className="font-mono text-foreground">
                    {"<deployment-url>"}
                    {registryGuideConfig.foundationChatRoute}
                  </code>
                  .
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-4 border border-foreground/10 p-4">
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                <PageText>{"What Foundation Chat installs"}</PageText>
              </p>
              <ul className="grid gap-2 text-muted-foreground text-xs/relaxed md:grid-cols-2">
                <li>
                  <code className="font-mono text-foreground">
                    app/demos/foundation-chat
                  </code>
                  <PageText> </PageText>
                  <PageText>{"page route."}</PageText>
                </li>
                <li>
                  <code className="font-mono text-foreground">
                    app/api/demos/foundation-chat
                  </code>
                  <PageText> </PageText>
                  <PageText>{"chat route."}</PageText>
                </li>
                <li>
                  <PageText>
                    {"AI Elements conversation, message, and prompt input UI."}
                  </PageText>
                </li>
                <li>
                  <PageText>
                    {
                      "AI SDK runtime helper plus the default AI Gateway env seam."
                    }
                  </PageText>
                </li>
              </ul>
            </div>
            <div className="border-foreground/10 border-t pt-4">
              <p className="text-muted-foreground text-xs/relaxed">
                <PageText>
                  {
                    "After install, this is normal source code in your app. Keep it, edit it, or move it under your own feature structure once the local chat check passes."
                  }
                </PageText>
              </p>
            </div>
          </aside>
        </section>

        <section
          className="space-y-4 border-foreground/10 border-t pt-8"
          id="repo-setup"
        >
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
              <PageText>{"Repo setup"}</PageText>
            </p>
            <h2 className="font-medium text-xl">
              <PageText>
                {"Add a small skill kit for future agent work"}
              </PageText>
            </h2>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              <PageText>
                {
                  "Once the new chat project is running, install these optional skills in the same repository. Four come from"
                }
              </PageText>
              <PageText> </PageText>
              <ExternalLink
                href={registryGuideConfig.sourceLinks.mattPocockSkills}
              >
                <PageText>{"Matt Pocock's skills"}</PageText>
              </ExternalLink>
              <PageText>{", and the docs memory skill comes from"}</PageText>
              <PageText> </PageText>
              <ExternalLink
                href={registryGuideConfig.sourceLinks.agentDocsSystemSkill}
              >
                <PageText>{"agent-docs-system-skill"}</PageText>
              </ExternalLink>
              <PageText>
                {
                  ". Together they help an agent align on the plan, keep durable project docs, use focused tests, review architecture, and split larger work into handoff-ready slices."
                }
              </PageText>
            </p>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              <PageText>
                {
                  "Recommendation: treat this as a lightweight engineering setup."
                }
              </PageText>
              <PageText> </PageText>
              <code className="font-mono text-foreground">grill-with-docs</code>
              <PageText> </PageText>
              <PageText>{"and"}</PageText>
              <PageText> </PageText>
              <code className="font-mono text-foreground">
                project-docs-system
              </code>
              <PageText> </PageText>
              <PageText>
                {
                  "give the agent a DDD-style shared language and project memory;"
                }
              </PageText>
              <PageText> </PageText>
              <code className="font-mono text-foreground">tdd</code>
              <PageText>{" and"}</PageText>
              <PageText> </PageText>
              <code className="font-mono text-foreground">
                improve-codebase-architecture
              </code>
              <PageText> </PageText>
              <PageText>
                {"keep behavior changes testable while the code is refactored;"}
              </PageText>
              <PageText> </PageText>
              <code className="font-mono text-foreground">to-issues</code>
              <PageText>
                {
                  " is the workflow helper for splitting larger work into small vertical slices."
                }
              </PageText>
            </p>
          </div>

          <GuideCommandPanel
            code={recommendedAgentSkillsCommand}
            title="recommended agent skills"
          />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recommendedAgentSkills.map((skill) => (
              <AgentSkillCard
                description={skill.description}
                docsUrl={skill.docsUrl}
                key={skill.name}
                name={skill.name}
              />
            ))}
          </div>
        </section>

        <section
          className="space-y-4 border-foreground/10 border-t pt-8"
          id="other-demos"
        >
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
              <PageText>{"Other registry demos"}</PageText>
            </p>
            <h2 className="font-medium text-xl">
              <PageText>{"Special setup notes"}</PageText>
            </h2>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              <PageText>
                {
                  "These demos are registry-backed today. After the namespace is registered, add the demo that matches your project and configure its service requirements from the setup note."
                }
              </PageText>
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {supportedRegistryDemoNotes.map((demo) => (
              <Card
                className="h-full border-foreground/10"
                key={demo.slug}
                size="sm"
              >
                <CardHeader>
                  <CardTitle>{demo.title}</CardTitle>
                  <CardDescription>{demo.slug}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-xs/relaxed">
                    {demo.setup}
                  </p>
                  <DemoCommandBlock command={demo.command} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
