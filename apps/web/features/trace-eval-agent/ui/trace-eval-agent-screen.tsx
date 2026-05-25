import { Badge } from "@workspace/ui/components/badge";

import { getTraceEvalAgentRuntimeState } from "../server/runtime";
import { TraceEvalAgentWorkspace } from "./trace-eval-agent-workspace";

export function TraceEvalAgentScreen() {
  const runtimeState = getTraceEvalAgentRuntimeState();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Demo / Trace and Eval Agent
            </p>
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              Live research chat with session trace and evaluation
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              This slice keeps a real research conversation at the top, then
              scores the same session below with execution trace, source
              coverage, answer-shape checks, and expected-path evaluation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
          </div>
        </header>

        <TraceEvalAgentWorkspace runtimeState={runtimeState} />
      </div>
    </main>
  );
}
