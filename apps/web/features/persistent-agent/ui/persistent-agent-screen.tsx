import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import {
  getPersistentAgentRuntimeState,
  type PersistentAgentRuntimeState,
} from "../server/runtime";
import type { PersistentAgentScreenData } from "../server/session";
import { PersistentAgentWorkspace } from "./persistent-agent-workspace";

interface PersistentAgentScreenProps extends PersistentAgentScreenData {
  runtimeState?: PersistentAgentRuntimeState;
}

export function PersistentAgentScreen({
  draftChatId,
  initialSession,
  recentChats,
  runtimeState = getPersistentAgentRuntimeState(),
}: PersistentAgentScreenProps) {
  return (
    <DemoWorkspaceShell
      badges={[
        runtimeState.statusLabel,
        runtimeState.chatModel,
        "Redis resume",
      ]}
      breadcrumbTitle="Persistent & Resume Agent"
      summary={
        <>
          This demo focuses on one contract: a chat becomes an addressable
          resource at <code>/demos/persistent-agent/[id]</code>, survives
          refresh, and keeps its visitor-private identity through a server-set
          cookie.
        </>
      }
      title="Persistent & Resume Agent"
    >
      <PersistentAgentWorkspace
        chatModel={runtimeState.chatModel}
        draftChatId={draftChatId}
        initialSession={initialSession}
        isChatAvailable={runtimeState.isChatAvailable}
        nodeVersion={runtimeState.nodeVersion}
        recentChats={recentChats}
        setupMessage={runtimeState.setupMessage}
      />
    </DemoWorkspaceShell>
  );
}
