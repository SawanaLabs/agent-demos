import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getMultimodalChatbotRuntimeState } from "@/features/multimodal-chatbot/server/runtime";
import { MultimodalChatbotWorkspace } from "@/features/multimodal-chatbot/ui/multimodal-chatbot-workspace";

export function MultimodalChatbotScreen() {
  const runtimeState = getMultimodalChatbotRuntimeState();

  return (
    <DemoWorkspaceShell
      badges={[runtimeState.statusLabel, runtimeState.chatModel]}
      breadcrumbTitle="Multi-Modal Chatbot"
      summary="This slice keeps the official AI SDK multimodal guide recognizable while turning it into a workspace for immediate image and PDF questions."
      title="Ad-hoc file chat over user-provided images and PDFs"
    >
      <MultimodalChatbotWorkspace
        acceptedMediaTypes={runtimeState.acceptedMediaTypes}
        chatModel={runtimeState.chatModel}
        isChatAvailable={runtimeState.isChatAvailable}
        nodeVersion={runtimeState.nodeVersion}
        setupMessage={runtimeState.setupMessage}
      />
    </DemoWorkspaceShell>
  );
}
