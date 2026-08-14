import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { minimalChatAgentDemoMeta } from "@/features/minimal-chat-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={minimalChatAgentDemoMeta} />;
}
