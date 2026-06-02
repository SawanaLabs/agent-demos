import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getStreamingChatShellRuntimeState } from "@/features/streaming-chat-shell/server/runtime";

import { StreamingChatShellWorkspace } from "./streaming-chat-shell-workspace";

export function StreamingChatShellScreen() {
  const runtimeState = getStreamingChatShellRuntimeState();

  return (
    <DemoWorkspaceShell
      badges={[runtimeState.statusLabel, runtimeState.chatModel]}
      breadcrumbTitle="Streaming Chat Shell"
      summary="This demo shows how one chat session can drive the user-facing transcript and a developer-side replay stream at the same time."
      title="A developer-facing chat runtime shell with replayable streaming trace"
    >
      <StreamingChatShellWorkspace
        chatModel={runtimeState.chatModel}
        isChatAvailable={runtimeState.isChatAvailable}
        nodeVersion={runtimeState.nodeVersion}
        setupMessage={runtimeState.setupMessage}
        supportedAudiences={runtimeState.supportedAudiences}
      />
    </DemoWorkspaceShell>
  );
}
