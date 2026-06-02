import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getSkillsAgentRuntimeState } from "@/features/skills-agent/server/runtime";
import { SkillsAgentWorkspace } from "@/features/skills-agent/ui/skills-agent-workspace";

export async function SkillsAgentScreen() {
  const runtimeState = await getSkillsAgentRuntimeState();

  return (
    <DemoWorkspaceShell
      badges={[runtimeState.statusLabel, runtimeState.chatModel]}
      breadcrumbTitle="Skills Builder Agent"
      summary="This workspace tracks the AI SDK skills guide closely: the model sees a lightweight catalog first, loads full skill instructions only when needed, and executes inside Vercel Sandbox."
      title="Load repo-local skills on demand and turn rough ideas into durable agent assets"
    >
      <SkillsAgentWorkspace
        availableSkills={runtimeState.availableSkills}
        chatModel={runtimeState.chatModel}
        environmentLabel={runtimeState.environmentLabel}
        isChatAvailable={runtimeState.isChatAvailable}
        sandboxProvider={runtimeState.sandboxProvider}
        setupMessage={runtimeState.setupMessage}
      />
    </DemoWorkspaceShell>
  );
}
