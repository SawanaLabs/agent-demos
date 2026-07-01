import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { multimodalChatbotDemoMeta } from "@/features/multimodal-chatbot/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={multimodalChatbotDemoMeta} />;
}
