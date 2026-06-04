import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@workspace/ui/components/badge";
import { buttonVariants } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";
import {
  demoCatalogEntries,
  demoGalleryVisualClasses,
  demoPatternLabels,
  readyDemoCatalogEntries,
  roadmapDemoCatalogEntries,
} from "@/features/demo-catalog/registry";
import type { DemoCatalogEntry } from "@/features/demo-catalog/types";
import { RegistryCopyButton } from "@/features/registry-guide/registry-copy-button";
import {
  registryGuideAgentTaskBrief,
  registryGuideConfig,
  registryGuideUrl,
} from "@/features/registry-guide/registry-guide-data";

export const metadata: Metadata = {
  description:
    "Browse production-ready agent demos that can be installed into fresh Next.js and shadcn projects through the Agent Demos registry.",
  title: "Agent Demos",
};

const recommendedDemoRanks = [
  {
    rankLabel: "Number One",
    slug: "ultra-chatbot-agent",
  },
  {
    rankLabel: "Number Two",
    slug: "langgraph-agent",
  },
  {
    rankLabel: "Number Three",
    slug: "openai-agents-sdk-demo",
  },
] as const;

const recommendedDemoEntries = recommendedDemoRanks.map((recommendation) => {
  const demo = readyDemoCatalogEntries.find(
    (entry) => entry.slug === recommendation.slug
  );

  if (!demo) {
    throw new Error(`Recommended demo is not ready: ${recommendation.slug}`);
  }

  return {
    demo,
    rankLabel: recommendation.rankLabel,
  };
});

const registryGuidePromptPreview = `Read ${registryGuideUrl} first. Then create a new shadcn Next.js app, install ${registryGuideConfig.namespace}/foundation-chat, configure AI_GATEWAY_API_KEY, verify one local chat message, and prepare the Vercel deployment env.`;

function DemoGalleryVisual({ demo }: { demo: DemoCatalogEntry }) {
  const styles = demoGalleryVisualClasses[demo.galleryVisual.accent];
  const { ascii } = demo.galleryVisual;

  return (
    <div className={cn("space-y-3 border p-3", styles.panel)}>
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "px-2 py-1 text-[11px] uppercase tracking-[0.18em]",
            styles.pill
          )}
        >
          {demo.galleryVisual.label}
        </span>
        <span className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
          {demoPatternLabels[demo.pattern]}
        </span>
      </div>
      {ascii ? (
        <div
          aria-label={`${demo.title} ASCII gallery visual`}
          className={cn(
            "flex aspect-video items-center justify-center overflow-hidden border p-3 [container-type:inline-size]",
            styles.ascii
          )}
          role="img"
        >
          <pre className="m-0 select-none whitespace-pre font-mono text-[clamp(8.5px,3.2cqw,12px)] leading-[1.05] [letter-spacing:0]">
            {ascii}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function DemoGalleryCard({
  demo,
  rankLabel,
}: {
  demo: DemoCatalogEntry;
  rankLabel?: string;
}) {
  const card = (
    <Card
      className="h-full border border-foreground/10 transition-colors hover:border-foreground/30"
      size="sm"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="outline">
              {demo.status === "ready" ? "Ready" : "Roadmap"}
            </Badge>
            <Badge variant="outline">{demoPatternLabels[demo.pattern]}</Badge>
          </div>
          {rankLabel ? (
            <Badge className="shrink-0" variant="outline">
              {rankLabel}
            </Badge>
          ) : null}
        </div>
        <CardTitle>{demo.title}</CardTitle>
        <CardDescription>{demo.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DemoGalleryVisual demo={demo} />
        <p className="text-muted-foreground text-xs/relaxed">
          Source: {demo.source}
        </p>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <span className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
          {demo.slug}
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          {demo.status === "ready" ? "Open demo" : "Planned"}
          <ArrowSquareOutIcon className="size-3.5" />
        </span>
      </CardFooter>
    </Card>
  );

  if (demo.status === "ready") {
    return <Link href={demo.href}>{card}</Link>;
  }

  return <div>{card}</div>;
}

function RegistryGuideCallout() {
  return (
    <section className="grid gap-5 border border-foreground/10 bg-background px-4 py-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
      <div className="space-y-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
          shadcn registry guide
        </p>
        <h2 className="max-w-3xl font-medium text-2xl tracking-tight">
          Start a new AI agent project from this registry
        </h2>
        <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
          The guide gives humans and coding agents one path: create a styled
          shadcn Next.js app, add Foundation Chat from the registry, run a real
          AI Gateway chat check, and prepare the same env for Vercel.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            href="/registry-guide"
          >
            Open registry guide
            <ArrowSquareOutIcon className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="overflow-hidden border border-foreground/10 bg-background">
        <div className="flex items-center justify-between gap-3 border-b bg-muted/70 px-3 py-2">
          <p className="truncate font-mono text-muted-foreground text-xs">
            agent task brief
          </p>
          <RegistryCopyButton value={registryGuideAgentTaskBrief} />
        </div>
        <pre className="m-0 whitespace-pre-wrap break-words p-3 font-mono text-foreground text-xs leading-relaxed">
          <code>{registryGuidePromptPreview}</code>
        </pre>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        <section className="grid gap-6 border border-foreground/10 bg-background px-4 py-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
              Agent Demos
            </p>
            <h1 className="max-w-4xl font-medium text-3xl tracking-tight md:text-4xl">
              Turn agent prototypes into deployable apps
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              Pick a production-ready demo slice, hand the guide to Codex, and
              ship a working Next.js agent app in about an hour. Already have a
              LangGraph agent? Use this as the launch path to a real web
              product.
            </p>
          </div>

          <div className="grid gap-3 border border-foreground/10 p-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Ready now
              </p>
              <p className="mt-1 font-medium text-2xl">
                {readyDemoCatalogEntries.length}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Roadmap
              </p>
              <p className="mt-1 font-medium text-2xl">
                {roadmapDemoCatalogEntries.length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm/relaxed">
                Ready demos follow stable AI SDK Recipes and docs sources while
                roadmap cards stay separate.
              </p>
            </div>
          </div>
        </section>

        <RegistryGuideCallout />

        <section className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
                  Recommend
                </p>
                <h2 className="mt-1 font-medium text-xl">Start here</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                {recommendedDemoEntries.length} highlighted demos
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recommendedDemoEntries.map(({ demo, rankLabel }) => (
                <DemoGalleryCard
                  demo={demo}
                  key={demo.slug}
                  rankLabel={rankLabel}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
                  Ready demos
                </p>
                <h2 className="mt-1 font-medium text-xl">Interactive now</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                {readyDemoCatalogEntries.length} of {demoCatalogEntries.length}{" "}
                demos
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {readyDemoCatalogEntries.map((demo) => (
                <DemoGalleryCard demo={demo} key={demo.slug} />
              ))}
            </div>
          </div>

          {roadmapDemoCatalogEntries.length > 0 ? (
            <div className="space-y-4 border-foreground/10 border-t pt-6">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
                  Roadmap
                </p>
                <h2 className="mt-1 font-medium text-xl">Planned demos</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {roadmapDemoCatalogEntries.map((demo) => (
                  <DemoGalleryCard demo={demo} key={demo.slug} />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
