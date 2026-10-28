import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";
import { PageText } from "@/components/page-copy";

import { AgentUxPrimitivesWorkspace } from "./agent-ux-primitives-workspace";

export function AgentUxPrimitivesScreen() {
  return (
    <TooltipProvider>
      <DemoWorkspaceShell
        badges={["ui-only", "copyable"]}
        breadcrumbTitle="Agent UX Primitives"
        headerFrame="card"
        summary={
          <>
            <PageText>{"A copyable showcase of all 19"}</PageText>
            <PageText> </PageText>
            <a
              className="underline underline-offset-2 hover:text-foreground"
              href="https://www.beautifului.dev/"
              rel="noreferrer"
              target="_blank"
            >
              <PageText>{"beautifului.dev"}</PageText>
            </a>
            <PageText>
              {
                "-inspired agent UX primitives — prompt bar, thinking trace, streaming text, chat, tables, nav, search, and more — rebuilt on top of our shadcn + ai-elements base. No source copied; each component is self-contained and can be lifted into any compatible Next.js + shadcn + ai-elements project."
              }
            </PageText>
          </>
        }
        title="Agent UX primitives, ready to lift"
        workspaceClassName="lg:h-auto"
      >
        <AgentUxPrimitivesWorkspace />
      </DemoWorkspaceShell>
    </TooltipProvider>
  );
}
