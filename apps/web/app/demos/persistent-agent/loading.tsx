import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { persistentAgentDemoMeta } from "@/features/persistent-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={persistentAgentDemoMeta} />;
}
