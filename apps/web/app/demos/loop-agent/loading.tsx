import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { loopAgentDemoMeta } from "@/features/loop-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={loopAgentDemoMeta} />;
}
