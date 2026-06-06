import { Badge } from "@workspace/ui/components/badge";
import { buttonVariants } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { cn } from "@workspace/ui/lib/utils";
import { HomeIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface SystemStatusPageProps {
  actions?: ReactNode;
  badge: string;
  description: string;
  icon: ReactNode;
  reference?: string;
  title: string;
  tone?: "destructive" | "neutral";
}

export function SystemStatusPage({
  actions,
  badge,
  description,
  icon,
  reference,
  title,
  tone = "neutral",
}: SystemStatusPageProps) {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            className="font-medium text-foreground text-sm tracking-normal"
            href="/"
          >
            Agent Demos
          </Link>
          <Badge variant={tone === "destructive" ? "destructive" : "outline"}>
            {badge}
          </Badge>
        </header>

        <Empty className="min-h-[calc(100svh-5.5rem)] border-0 px-0 py-12">
          <EmptyHeader>
            <EmptyMedia
              className={cn(
                "size-10 border",
                tone === "destructive"
                  ? "border-destructive/20 bg-destructive/10 text-destructive"
                  : "border-border bg-muted text-muted-foreground"
              )}
              variant="icon"
            >
              {icon}
            </EmptyMedia>
            <EmptyTitle className="max-w-2xl text-balance text-2xl sm:text-3xl">
              {title}
            </EmptyTitle>
            <EmptyDescription className="max-w-lg text-sm">
              {description}
            </EmptyDescription>
          </EmptyHeader>

          <EmptyContent>
            {reference ? (
              <p className="border border-border bg-muted px-2.5 py-1.5 font-mono text-muted-foreground text-xs">
                Error reference: {reference}
              </p>
            ) : null}

            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              {actions}
              <Link
                className={buttonVariants({
                  className: "w-full sm:w-auto",
                  variant: actions ? "outline" : "default",
                })}
                href="/"
              >
                <HomeIcon className="size-3.5" />
                Home
              </Link>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  );
}
