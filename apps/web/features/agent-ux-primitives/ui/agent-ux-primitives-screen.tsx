import { TooltipProvider } from "@workspace/ui/components/tooltip";

import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { AgentUxPrimitivesWorkspace } from "./agent-ux-primitives-workspace";

export function AgentUxPrimitivesScreen() {
  return (
    <TooltipProvider>
      <DemoWorkspaceShell
        badges={["ui-only", "copyable"]}
        breadcrumbTitle="Agent UX Primitives"
        headerFrame="card"
        summary="A copyable showcase of agent UX primitives — prompt bar, thinking trace, streaming text, tool chips, and approval card — rebuilt on top of our shadcn + ai-elements base. Interaction patterns inspired by beautifului.dev; no source copied. Each component is self-contained and can be lifted into any compatible Next.js + shadcn + ai-elements project."
        title="Agent UX primitives, ready to lift"
        workspaceClassName="lg:h-auto"
      >
        <AgentUxPrimitivesWorkspace />
      </DemoWorkspaceShell>
    </TooltipProvider>
  );
}
