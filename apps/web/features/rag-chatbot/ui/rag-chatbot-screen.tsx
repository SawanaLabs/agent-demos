import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getRagChatbotRuntimeState } from "@/features/rag-chatbot/server/runtime";
import { RagChatbotWorkspace } from "@/features/rag-chatbot/ui/rag-chatbot-workspace";

export async function RagChatbotScreen() {
  const runtimeState = await getRagChatbotRuntimeState();

  return (
    <DemoWorkspaceShell
      badges={[runtimeState.statusLabel, runtimeState.chatModel]}
      breadcrumbTitle="RAG Chatbot"
      summary="This slice turns the official AI SDK RAG recipe into a website support chatbot: retrieval-first answers, visible tool state, and source snippets tied to a durable pgvector store."
      title="Grounded document support chat over a preindexed design manual"
    >
      <RagChatbotWorkspace
        chatModel={runtimeState.chatModel}
        isChatAvailable={runtimeState.isChatAvailable}
        nodeVersion={runtimeState.nodeVersion}
        setupMessage={runtimeState.setupMessage}
        sourceDocument={runtimeState.sourceDocument}
      />
    </DemoWorkspaceShell>
  );
}
