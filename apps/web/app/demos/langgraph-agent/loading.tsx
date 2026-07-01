import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { langGraphAgentDemoMeta } from "@/features/langgraph-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={langGraphAgentDemoMeta} />;
}
