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
import { ArrowLeft, ArrowUpRight, CheckCircle2, Terminal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { RegistryCopyButton } from "@/features/registry-guide/registry-copy-button";
import {
  foundationChatEnvExample,
  registryGuideConfig,
  supportedRegistryDemoNotes,
} from "@/features/registry-guide/registry-guide-data";

const quickInstallCommand = `${registryGuideConfig.namespaceSetupCommand}
${registryGuideConfig.foundationChatCommand}`;

const runCommand = `pnpm dev
# open http://localhost:3000${registryGuideConfig.foundationChatRoute}`;

export const metadata: Metadata = {
  description:
    "Install AI SDK 6 Agent Demos into a Next.js App Router project through the public shadcn registry.",
  title: "shadcn Registry Guide | AI SDK 6 Agent Demos",
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

function GuideCommandPanel({ code, title }: { code: string; title: string }) {
  return (
    <div className="overflow-hidden border border-foreground/10 bg-background">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/80 px-3 py-2 text-muted-foreground text-xs">
        <div className="flex min-w-0 items-center gap-2">
          <Terminal className="size-3.5 shrink-0" />
          <span className="truncate font-mono">{title}</span>
        </div>
        <RegistryCopyButton value={code} />
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

export default function RegistryGuidePage() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        <section className="grid gap-6 border border-foreground/10 bg-background px-4 py-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <Link
              className="inline-flex items-center gap-2 text-muted-foreground text-xs hover:text-foreground"
              href="/"
            >
              <ArrowLeft className="size-3.5" />
              Back to demos
            </Link>
            <div className="space-y-3">
              <Badge variant="outline">Public registry guide</Badge>
              <h1 className="max-w-4xl font-medium text-3xl tracking-tight md:text-4xl">
                Install Foundation Chat with the shadcn registry
              </h1>
              <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
                This guide is for developers, coding agents, and first-time
                evaluators who want to place one demo into their own Next.js App
                Router project. The source lives in the{" "}
                <ExternalLink href={registryGuideConfig.sourceLinks.githubRepo}>
                  GitHub repository
                </ExternalLink>
                ; the install path follows the public{" "}
                <ExternalLink
                  href={registryGuideConfig.sourceLinks.shadcnRegistryDocs}
                >
                  shadcn registry
                </ExternalLink>{" "}
                namespace flow.
              </p>
              <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
                Start with Foundation Chat. It is the smallest production-ready
                slice of this repo's{" "}
                <ExternalLink href={registryGuideConfig.sourceLinks.aiSdkDocs}>
                  AI SDK
                </ExternalLink>{" "}
                plus{" "}
                <ExternalLink
                  href={registryGuideConfig.sourceLinks.aiElementsDocs}
                >
                  AI Elements
                </ExternalLink>{" "}
                stack: one chat page, one API route, and the required AI Gateway
                env vars.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className={cn(buttonVariants({ size: "sm" }))}
                href="#install"
              >
                Start install
              </Link>
              <Link
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" })
                )}
                href="#other-demos"
              >
                Other demos
              </Link>
            </div>
          </div>

          <div className="grid content-start gap-4 border border-foreground/10 p-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Registry host
              </p>
              <p className="mt-1 break-all font-medium text-sm">
                {registryGuideConfig.domain}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                  Namespace
                </p>
                <p className="mt-1 font-mono text-sm">
                  {registryGuideConfig.namespace}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                  Supported
                </p>
                <p className="mt-1 font-medium text-sm">
                  {supportedRegistryDemoNotes.length + 1} demos
                </p>
              </div>
            </div>
            <GuideCommandPanel
              code={quickInstallCommand}
              title="quick install"
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <RequirementCard title="Start from a shadcn app">
            Use a Next.js App Router project with an existing{" "}
            <code className="font-mono text-foreground">components.json</code>.
            If you do not have one yet, follow the{" "}
            <ExternalLink
              href={registryGuideConfig.sourceLinks.shadcnInstallDocs}
            >
              shadcn installation guide
            </ExternalLink>{" "}
            first.
          </RequirementCard>
          <RequirementCard title="Use AI Gateway env vars">
            Foundation Chat expects an{" "}
            <code className="font-mono text-foreground">
              AI_GATEWAY_API_KEY
            </code>{" "}
            value. Use the{" "}
            <ExternalLink
              href={registryGuideConfig.sourceLinks.aiSdkProviderSetup}
            >
              AI SDK provider setup guide
            </ExternalLink>{" "}
            when choosing a provider for the first time.
          </RequirementCard>
          <RequirementCard title="Let the CLI write files">
            The registry installs route files, UI components, runtime helpers,
            package dependencies, and env examples through the shadcn CLI.
            Review the diff before committing.
          </RequirementCard>
        </section>

        <section
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
          id="install"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
                Main path
              </p>
              <h2 className="font-medium text-2xl tracking-tight">
                Install Foundation Chat first
              </h2>
              <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
                Run these commands from the root of your consumer app. The first
                command records the namespace in your local shadcn config; the
                second command installs the Foundation Chat registry item.
              </p>
            </div>

            <div className="space-y-4">
              <GuideCommandPanel
                code={registryGuideConfig.namespaceSetupCommand}
                title="1. add registry namespace"
              />
              <GuideCommandPanel
                code={registryGuideConfig.foundationChatCommand}
                title="2. install foundation-chat"
              />
              <GuideCommandPanel
                code={foundationChatEnvExample}
                title="3. .env.local"
              />
              <GuideCommandPanel code={runCommand} title="4. run and open" />
            </div>
          </div>

          <aside className="h-fit space-y-4 border border-foreground/10 p-4">
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                What gets installed
              </p>
              <ul className="space-y-2 text-muted-foreground text-xs/relaxed">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                  <span>
                    <code className="font-mono text-foreground">
                      app/demos/foundation-chat
                    </code>{" "}
                    route.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                  <span>
                    <code className="font-mono text-foreground">
                      app/api/demos/foundation-chat
                    </code>{" "}
                    chat route.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                  <span>
                    AI Elements conversation, message, and prompt input UI.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                  <span>
                    AI SDK runtime helper and AI Gateway env examples.
                  </span>
                </li>
              </ul>
            </div>
            <div className="border-foreground/10 border-t pt-4">
              <p className="text-muted-foreground text-xs/relaxed">
                After install, this is normal source code in your app. Keep it,
                edit it, or move it under your own feature structure after you
                understand the copy boundary.
              </p>
            </div>
          </aside>
        </section>

        <section className="space-y-4 border-foreground/10 border-t pt-8">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
              Coding agents
            </p>
            <h2 className="font-medium text-xl">Give the agent this path</h2>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              If you paste this page into a coding agent, ask it to install
              Foundation Chat first, inspect the generated diff, add env
              placeholders, then run the consumer repo's typecheck or build. For
              the database and sandbox demos below, the agent should stop and
              ask for the missing service credentials instead of inventing them.
            </p>
          </div>
          <GuideCommandPanel
            code="Install @ai-sdk-6-demos/foundation-chat into this Next.js App Router project, preserve the existing shadcn aliases, set the documented env placeholders, and run the repo checks before summarizing the diff."
            title="agent prompt"
          />
        </section>

        <section
          className="space-y-4 border-foreground/10 border-t pt-8"
          id="other-demos"
        >
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
              Other registry demos
            </p>
            <h2 className="font-medium text-xl">Special setup notes</h2>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              These demos are registry-backed today. Install Foundation Chat
              first, then use the same namespace to add a larger demo when its
              extra services match your project.
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
                  <code className="block break-all border border-foreground/10 bg-muted/40 p-2 font-mono text-[11px] text-foreground leading-relaxed">
                    {demo.command}
                  </code>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
