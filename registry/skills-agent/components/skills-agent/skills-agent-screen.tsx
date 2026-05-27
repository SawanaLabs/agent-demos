import { Badge } from "@/components/ui/badge";

import { getSkillsAgentRuntimeState } from "@/lib/skills-agent/server/runtime";
import { SkillsAgentWorkspace } from "./skills-agent-workspace";

export async function SkillsAgentScreen() {
  const runtimeState = await getSkillsAgentRuntimeState();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Demo / Skills Builder Agent
            </p>
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              Load repo-local skills on demand and turn rough ideas into durable
              agent assets
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              This workspace tracks the AI SDK skills guide closely: the model
              sees a lightweight catalog first, loads full skill instructions
              only when needed, and executes inside Vercel Sandbox.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
          </div>
        </header>

        <SkillsAgentWorkspace
          availableSkills={runtimeState.availableSkills}
          chatModel={runtimeState.chatModel}
          isChatAvailable={runtimeState.isChatAvailable}
          nodeVersion={runtimeState.nodeVersion}
          sandboxProvider={runtimeState.sandboxProvider}
          setupMessage={runtimeState.setupMessage}
        />
      </div>
    </main>
  );
}
