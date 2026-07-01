import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { ragChatbotDemoMeta } from "@/features/rag-chatbot/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={ragChatbotDemoMeta} />;
}
