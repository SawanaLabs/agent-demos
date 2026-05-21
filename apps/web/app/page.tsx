import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import Link from "next/link";

import {
  demoGallery,
  demoPatternLabels,
  readyDemos,
  roadmapDemos,
} from "@/features/demo-catalog/registry";

export default function Page() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        <section className="grid gap-6 border border-foreground/10 bg-background px-4 py-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.24em]">
              AI SDK 6 Agent Demos
            </p>
            <h1 className="max-w-4xl font-medium text-3xl tracking-tight md:text-4xl">
              A portable gallery of production-ready agent demos for Next.js and
              shadcn monorepos
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              Each demo is a feature slice with its own route, server entry,
              metadata, and UI surface so it can be copied into a new project
              with minimal rewriting.
            </p>
          </div>

          <div className="grid gap-3 border border-foreground/10 p-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Ready now
              </p>
              <p className="mt-1 font-medium text-2xl">{readyDemos.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Roadmap
              </p>
              <p className="mt-1 font-medium text-2xl">{roadmapDemos.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm/relaxed">
                The first slot is live. The next batches follow the stable AI
                SDK cookbook and guide recipes.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {demoGallery.map((demo) =>
            demo.href ? (
              <Link href={demo.href} key={demo.slug}>
                <Card
                  className="h-full border border-foreground/10 transition-colors hover:border-foreground/30"
                  size="sm"
                >
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {demo.status === "ready" ? "Ready" : "Roadmap"}
                      </Badge>
                      <Badge variant="outline">
                        {demoPatternLabels[demo.pattern]}
                      </Badge>
                    </div>
                    <CardTitle>{demo.title}</CardTitle>
                    <CardDescription>{demo.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-xs/relaxed">
                      Source: {demo.source}
                    </p>
                  </CardContent>
                  <CardFooter className="justify-between gap-3">
                    <span className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
                      {demo.slug}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs">
                      Open demo
                      <ArrowRightIcon className="size-3.5" />
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ) : (
              <div key={demo.slug}>
                <Card
                  className="h-full border border-foreground/10 transition-colors hover:border-foreground/30"
                  size="sm"
                >
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Roadmap</Badge>
                      <Badge variant="outline">
                        {demoPatternLabels[demo.pattern]}
                      </Badge>
                    </div>
                    <CardTitle>{demo.title}</CardTitle>
                    <CardDescription>{demo.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-xs/relaxed">
                      Source: {demo.source}
                    </p>
                  </CardContent>
                  <CardFooter className="justify-between gap-3">
                    <span className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
                      {demo.slug}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs">
                      Planned
                      <ArrowRightIcon className="size-3.5" />
                    </span>
                  </CardFooter>
                </Card>
              </div>
            )
          )}
        </section>
      </div>
    </main>
  );
}
