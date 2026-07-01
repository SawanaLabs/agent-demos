import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { foundationChatDemoMeta } from "@/features/foundation-chat/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={foundationChatDemoMeta} />;
}
