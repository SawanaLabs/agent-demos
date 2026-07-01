import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { streamingChatShellDemoMeta } from "@/features/streaming-chat-shell/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={streamingChatShellDemoMeta} />;
}
