import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { ultraChatbotAgentDemoMeta } from "@/features/ultra-chatbot-agent/demo-meta";

export default function Loading() {
  return (
    <DemoRouteLoadingScreen
      demo={ultraChatbotAgentDemoMeta}
      summary="The saved conversation, model list, and recent chat history are loading for this visitor."
      title="Opening chatbot conversation"
    />
  );
}
