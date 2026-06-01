import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getSandboxAgentRuntimeState } from "@/features/sandbox-agent/server/runtime";
import { SandboxAgentWorkspace } from "@/features/sandbox-agent/ui/sandbox-agent-workspace";

export async function SandboxAgentScreen() {
  const runtimeState = await getSandboxAgentRuntimeState();

  return (
    <DemoWorkspaceShell
      badges={[runtimeState.statusLabel, runtimeState.chatModel]}
      breadcrumbTitle="Sandbox Workspace Agent"
      summary="This workspace gives one persistent Vercel Sandbox to each chat, lets the model write HTML, CSS, and JavaScript files, and renders the generated app through AI Elements WebPreview."
      title="Build a frontend prototype in an isolated workspace and expose the live result"
    >
      <SandboxAgentWorkspace
        chatModel={runtimeState.chatModel}
        isChatAvailable={runtimeState.isChatAvailable}
        nodeVersion={runtimeState.nodeVersion}
        previewPort={runtimeState.previewPort}
        sandboxProvider={runtimeState.sandboxProvider}
        setupMessage={runtimeState.setupMessage}
      />
    </DemoWorkspaceShell>
  );
}
