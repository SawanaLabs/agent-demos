import { TooltipProvider } from "@workspace/ui/components/tooltip";

import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { EveAgentWorkspace } from "./eve-agent-workspace";

export function EveAgentScreen() {
  return (
    <TooltipProvider>
      <DemoWorkspaceShell
        badges={["openai/gpt-5-mini", "eve (beta)", "filesystem-first"]}
        breadcrumbClassName="font-heading text-xs tracking-[0.16em]"
        breadcrumbTitle="Eve Agent"
        headerFrame="card"
        summary="A service-triage chat agent running on Vercel's eve framework. The agent lives in agents/service-triage/agent/ — instructions.md, tools/, agent.ts — and is mounted at /eve/service-triage/v1/* by vercel.ts. Every turn drives eve's agent loop: plan a step, call a tool, observe, repeat."
        title="An eve agent loop you can watch work"
      >
        <EveAgentWorkspace />
      </DemoWorkspaceShell>
    </TooltipProvider>
  );
}
