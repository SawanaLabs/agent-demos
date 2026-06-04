import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { DemoBreadcrumb } from "@/components/demo-breadcrumb";

type DemoWorkspaceHeaderFrame = "header" | "card";

interface DemoWorkspaceShellProps {
  badges?: readonly ReactNode[];
  breadcrumbClassName?: string;
  breadcrumbTitle?: string;
  children: ReactNode;
  contentClassName?: string;
  headerClassName?: string;
  headerFrame?: DemoWorkspaceHeaderFrame;
  maxWidthClassName?: string;
  summary: ReactNode;
  summaryClassName?: string;
  title: string;
  titleClassName?: string;
  workspaceClassName?: string | null;
}

const defaultHeaderClassName =
  "grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end";

const cardHeaderClassName =
  "grid gap-4 bg-background px-4 py-5 text-base text-foreground leading-normal md:grid-cols-[minmax(0,1fr)_auto] md:items-end";

export function DemoWorkspaceShell({
  badges = [],
  breadcrumbClassName,
  breadcrumbTitle,
  children,
  contentClassName,
  headerClassName,
  headerFrame = "header",
  maxWidthClassName = "max-w-7xl",
  summary,
  summaryClassName = "max-w-3xl",
  title,
  titleClassName = "max-w-3xl",
  workspaceClassName = "lg:h-svh",
}: DemoWorkspaceShellProps) {
  const headerContent = (
    <>
      <div className="space-y-2">
        <DemoBreadcrumb
          className={breadcrumbClassName}
          title={breadcrumbTitle ?? title}
        />
        <h1
          className={cn("font-medium text-2xl tracking-tight", titleClassName)}
        >
          {title}
        </h1>
        <p
          className={cn(
            "text-muted-foreground text-sm/relaxed",
            summaryClassName
          )}
        >
          {summary}
        </p>
      </div>

      {badges.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {badges.map((badge, index) => (
            <Badge key={String(index)} variant="outline">
              {badge}
            </Badge>
          ))}
        </div>
      ) : null}
    </>
  );

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-6 px-4 py-6 md:px-6",
          maxWidthClassName,
          contentClassName
        )}
      >
        {headerFrame === "card" ? (
          <Card className={cn(cardHeaderClassName, headerClassName)}>
            {headerContent}
          </Card>
        ) : (
          <header className={cn(defaultHeaderClassName, headerClassName)}>
            {headerContent}
          </header>
        )}

        {workspaceClassName ? (
          <div className={workspaceClassName}>{children}</div>
        ) : (
          children
        )}
      </div>
    </main>
  );
}
