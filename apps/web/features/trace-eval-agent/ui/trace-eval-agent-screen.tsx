import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getTraceEvalAgentRuntimeState } from "../server/runtime";
import { TraceEvalAgentWorkspace } from "./trace-eval-agent-workspace";

export function TraceEvalAgentScreen() {
  const runtimeState = getTraceEvalAgentRuntimeState();

  return (
    <DemoWorkspaceShell
      badges={[runtimeState.statusLabel, runtimeState.chatModel]}
      breadcrumbTitle="Trace and Eval Agent"
      summary="This slice keeps a real research conversation at the top, then scores the same session below with execution trace, source coverage, answer-shape checks, and expected-path evaluation."
      title="Live research chat with session trace and evaluation"
    >
      <TraceEvalAgentWorkspace runtimeState={runtimeState} />
    </DemoWorkspaceShell>
  );
}
