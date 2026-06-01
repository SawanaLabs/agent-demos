"use client";

import {
  CheckCircleIcon,
  CircleIcon,
  CircleNotchIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "@workspace/ui/components/ai-elements/task";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";

import type { TraceEvalRunOutcome } from "../model/trace-eval-run-outcome";
import type { TraceEvalSnapshot } from "../model/trace-eval-snapshot";

const traceStatusStyles = {
  failed: "text-red-600",
  passed: "text-green-600",
  pending: "text-muted-foreground",
  running: "text-blue-600",
} as const;

const traceStatusIcons = {
  failed: XCircleIcon,
  passed: CheckCircleIcon,
  pending: CircleIcon,
  running: CircleNotchIcon,
} as const;

export function TraceEvalAgentTracePanel({
  runOutcome,
  snapshot,
}: {
  runOutcome: TraceEvalRunOutcome;
  snapshot: TraceEvalSnapshot;
}) {
  if (runOutcome.kind === "failed-run") {
    return (
      <section className="min-h-0 overflow-y-auto rounded-lg border border-foreground/10 bg-background p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-medium text-sm">Trace</h2>
            <p className="text-muted-foreground text-xs">
              Current conversation execution path
            </p>
          </div>
          <Badge variant="outline">failed</Badge>
        </div>

        <Task defaultOpen>
          <TaskTrigger title={runOutcome.title} />
          <TaskContent>
            <TaskItem className="space-y-1">
              <div className="flex items-start gap-2">
                <XCircleIcon className="mt-0.5 size-4 shrink-0 text-red-600" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm">
                    Run failed before trace evaluation
                  </p>
                  <p className="text-muted-foreground text-xs/relaxed">
                    {runOutcome.detail}
                  </p>
                </div>
              </div>
            </TaskItem>
          </TaskContent>
        </Task>
      </section>
    );
  }

  return (
    <section className="min-h-0 overflow-y-auto rounded-lg border border-foreground/10 bg-background p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-medium text-sm">Trace</h2>
          <p className="text-muted-foreground text-xs">
            Current conversation execution path
          </p>
        </div>
        <Badge variant="outline">{snapshot.status}</Badge>
      </div>

      <Task defaultOpen>
        <TaskTrigger title="Execution trace" />
        <TaskContent>
          {snapshot.trace.map((item) => {
            const Icon = traceStatusIcons[item.status];

            return (
              <TaskItem className="space-y-1" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        traceStatusStyles[item.status]
                      )}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {item.title}
                      </p>
                      <p className="text-muted-foreground text-xs/relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                  {item.metric ? (
                    <Badge className="shrink-0" variant="outline">
                      {item.metric}
                    </Badge>
                  ) : null}
                </div>
              </TaskItem>
            );
          })}
        </TaskContent>
      </Task>
    </section>
  );
}
