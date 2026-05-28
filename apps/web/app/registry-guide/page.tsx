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
import { ArrowLeft, ArrowUpRight, Terminal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { RegistryCopyButton } from "@/features/registry-guide/registry-copy-button";
import {
  registryGuideConfig,
  supportedRegistryDemoNotes,
} from "@/features/registry-guide/registry-guide-data";
import { RegistrySmoothScroll } from "@/features/registry-guide/registry-smooth-scroll";

const quickInstallCommand = `${registryGuideConfig.namespaceSetupCommand}
${registryGuideConfig.foundationChatCommand}`;

export const metadata: Metadata = {
  description:
    "Create a shadcn Next.js app, install Foundation Chat through the public registry, run it locally, and deploy it to Vercel.",
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
            Back to demos
          </Link>
          <div className="space-y-3">
            <Badge variant="outline">Public registry guide</Badge>
            <h1 className="max-w-5xl font-medium text-3xl tracking-tight md:text-4xl">
              From shadcn Create to a deployed Foundation Chat
            </h1>
            <p className="max-w-4xl text-muted-foreground text-sm/relaxed">
              This guide is for developers, coding agents, and first-time
              evaluators who want a clean path from a new shadcn Next.js app to
              a working AI chat on the web. The source lives in the{" "}
              <ExternalLink href={registryGuideConfig.sourceLinks.githubRepo}>
                GitHub repository
              </ExternalLink>
              ; the demo install follows the public{" "}
              <ExternalLink
                href={registryGuideConfig.sourceLinks.shadcnRegistryDocs}
              >
                shadcn registry
              </ExternalLink>{" "}
              namespace flow.
            </p>
            <p className="max-w-4xl text-muted-foreground text-sm/relaxed">
              Start by creating a styled project in{" "}
              <ExternalLink href={registryGuideConfig.sourceLinks.shadcnCreate}>
                shadcn Create
              </ExternalLink>
              , then add Foundation Chat. It is the smallest production-ready
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
              env vars. If you plan to swap models or use direct provider
              packages after installation, start from the{" "}
              <ExternalLink
                href={registryGuideConfig.sourceLinks.aiSdkProviderSetup}
              >
                AI SDK provider guide
              </ExternalLink>{" "}
              so the demo stays aligned with the official provider contract.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className={cn(buttonVariants({ size: "sm" }))}
              href="#install"
            >
              Quick install
            </Link>
            <Link
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              href="#next-steps"
            >
              Full path
            </Link>
          </div>
        </section>

        <section
          className="grid gap-5 border border-foreground/10 bg-background p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
          id="install"
        >
          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
              Quick point
            </p>
            <h2 className="font-medium text-2xl tracking-tight">
              Install the Foundation Chat page slice
            </h2>
            <p className="text-muted-foreground text-sm/relaxed">
              This registry item is the core thing this project contributes: it
              drops a working chat page, API route, AI Elements UI, and AI SDK
              runtime wiring into the app you created.
            </p>
          </div>

          <GuideCommandPanel code={quickInstallCommand} title="quick install" />
        </section>

        <section className="grid gap-4 md:grid-cols-3" id="next-steps">
          <RequirementCard title="Create a shadcn project">
            Use{" "}
            <ExternalLink href={registryGuideConfig.sourceLinks.shadcnCreate}>
              shadcn Create
            </ExternalLink>{" "}
            to choose Next.js, pick a theme, and run the generated command in
            the new project folder.
          </RequirementCard>
          <RequirementCard title="Get an AI Gateway key">
            Create a key from the{" "}
            <ExternalLink
              href={registryGuideConfig.sourceLinks.aiGatewayAuthenticationDocs}
            >
              AI Gateway authentication docs
            </ExternalLink>
            , add it as{" "}
            <code className="font-mono text-foreground">
              AI_GATEWAY_API_KEY
            </code>{" "}
            in <code className="font-mono text-foreground">.env.local</code>,
            then run the chat locally and send one message.
          </RequirementCard>
          <RequirementCard title="Deploy">
            Import the project into{" "}
            <ExternalLink
              href={registryGuideConfig.sourceLinks.vercelGitDeploymentsDocs}
            >
              Vercel from Git
            </ExternalLink>{" "}
            and add the same AI Gateway key in Project Settings before the
            production check.
          </RequirementCard>
        </section>

        <section className="space-y-4 border-foreground/10 border-t pt-8">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
              Coding agents
            </p>
            <h2 className="font-medium text-xl">Give the agent this path</h2>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              If you paste this page into a coding agent, ask it to follow the
              same path: create the shadcn Next.js app from the selected Create
              command, install Foundation Chat, add env placeholders, run a
              local chat check, then prepare the Vercel env. For the database
              and sandbox demos below, the agent should stop and ask for the
              missing service credentials instead of inventing them.
            </p>
          </div>
          <GuideCommandPanel
            code="Use the shadcn Create command I selected to create a Next.js app, then install @ai-sdk-6-demos/foundation-chat, set the documented AI Gateway env placeholders, verify local chat works, and prepare the Vercel environment variables before summarizing the diff."
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
