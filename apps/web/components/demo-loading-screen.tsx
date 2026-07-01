import { Skeleton } from "@workspace/ui/components/skeleton";
import type { ReactNode } from "react";

import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";
import type {
  DemoCatalogEntry,
  DemoPattern,
} from "@/features/demo-catalog/types";

interface DemoLoadingShellProps {
  badges?: readonly ReactNode[];
  breadcrumbTitle?: string;
  summary: ReactNode;
  title: string;
  workspaceClassName?: string | null;
}

interface DemoRouteLoadingScreenProps {
  badges?: readonly ReactNode[];
  demo: DemoCatalogEntry;
  summary?: ReactNode;
  title?: string;
  workspaceClassName?: string | null;
}

const loadingLineKeys = [
  "loading-line-primary",
  "loading-line-secondary",
  "loading-line-tertiary",
] as const;

const loadingCardKeys = [
  "loading-card-primary",
  "loading-card-secondary",
  "loading-card-tertiary",
] as const;

const demoLoadingPatternLabels: Record<DemoPattern, string> = {
  foundation: "Foundation",
  "generative-ui": "Generative UI",
  langgraph: "LangGraph",
  loop: "Loop Agent",
  mcp: "MCP",
  multimodal: "Multimodal",
  rag: "RAG",
  sandbox: "Sandbox",
  skills: "Skills",
  "structured-output": "Structured Output",
  tools: "Tools",
};

export function DemoLoadingShell({
  badges = ["Loading"],
  breadcrumbTitle,
  summary,
  title,
  workspaceClassName,
}: DemoLoadingShellProps) {
  return (
    <DemoWorkspaceShell
      badges={badges}
      breadcrumbTitle={breadcrumbTitle}
      summary={summary}
      title={title}
      workspaceClassName={workspaceClassName}
    >
      <DemoWorkspaceSkeleton />
    </DemoWorkspaceShell>
  );
}

export function DemoRouteLoadingScreen({
  badges,
  demo,
  summary = demo.summary,
  title = demo.title,
  workspaceClassName,
}: DemoRouteLoadingScreenProps) {
  return (
    <DemoLoadingShell
      badges={badges ?? [demoLoadingPatternLabels[demo.pattern], "Loading"]}
      breadcrumbTitle={demo.title}
      summary={summary}
      title={title}
      workspaceClassName={workspaceClassName}
    />
  );
}

function DemoWorkspaceSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Demo workspace loading"
      className="grid min-h-[28rem] gap-4 border border-foreground/10 bg-background p-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="flex min-h-0 flex-col gap-4">
        <div className="space-y-3 border border-foreground/10 bg-muted/30 p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-4/5" />
        </div>
        <div className="flex-1 space-y-3 border border-foreground/10 bg-background p-4">
          {loadingLineKeys.map((key, index) => (
            <Skeleton
              className={index === 0 ? "h-14 w-3/4" : "h-16 w-full"}
              key={key}
            />
          ))}
        </div>
      </div>

      <aside className="space-y-3 border border-foreground/10 bg-muted/30 p-4">
        <Skeleton className="h-5 w-24" />
        {loadingCardKeys.map((key) => (
          <Skeleton className="h-20 w-full" key={key} />
        ))}
      </aside>
    </section>
  );
}
