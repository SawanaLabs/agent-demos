import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { eveAgentDemoMeta } from "@/features/eve-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={eveAgentDemoMeta} />;
}
