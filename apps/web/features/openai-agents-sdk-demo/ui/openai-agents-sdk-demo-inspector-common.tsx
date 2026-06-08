import { CaretDownIcon } from "@phosphor-icons/react";
import { Badge } from "@workspace/ui/components/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode } from "react";

import type { OpenAiAgentsSdkDemoGuideCoverage } from "../server/guide-coverage";
import type { OpenAiAgentsSdkDemoToolCatalogEntry } from "../server/tools";

export function getImplementationLabel(
  status: OpenAiAgentsSdkDemoGuideCoverage["implementationStatus"]
) {
  if (status === "implemented") {
    return "Implemented";
  }

  if (status === "blocked") {
    return "Blocked";
  }

  return "Not started";
}

export function getRunStatusLabel(
  status: OpenAiAgentsSdkDemoGuideCoverage["currentRunStatus"]
) {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "used-this-run") {
    return "Used this run";
  }

  if (status === "blocked") {
    return "Blocked";
  }

  return "Not started";
}

export function getStatusClassName(
  status:
    | OpenAiAgentsSdkDemoGuideCoverage["currentRunStatus"]
    | OpenAiAgentsSdkDemoGuideCoverage["implementationStatus"]
) {
  if (
    status === "implemented" ||
    status === "ready" ||
    status === "used-this-run"
  ) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (status === "blocked") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  return "border-foreground/10 bg-muted/40 text-muted-foreground";
}

export function getToolAvailabilityClassName(
  availability: OpenAiAgentsSdkDemoToolCatalogEntry["availability"]
) {
  if (availability === "configured") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (availability === "provider-blocked") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  return "border-foreground/10 bg-muted/40 text-muted-foreground";
}

export function InspectorBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "h-auto min-w-0 max-w-full shrink items-start overflow-hidden whitespace-normal break-all px-2 py-1 text-left text-[11px] leading-tight",
        className
      )}
      variant="outline"
    >
      {children}
    </Badge>
  );
}

export function InspectorRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 max-w-[9rem] break-all text-right text-foreground text-xs leading-5">
        {value}
      </span>
    </div>
  );
}

export function InspectorCollapsible({
  children,
  defaultOpen = false,
  summary,
  title,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  summary: string;
  title: string;
}) {
  return (
    <Collapsible
      className="border border-foreground/10"
      defaultOpen={defaultOpen}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm">{title}</p>
          <p className="text-muted-foreground text-xs leading-5">{summary}</p>
        </div>
        <CaretDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-foreground/10 border-t px-3 py-3 text-sm">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
