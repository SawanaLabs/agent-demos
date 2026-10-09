import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { multiAgentExplorerDemoMeta } from "@/features/multi-agent-explorer/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={multiAgentExplorerDemoMeta} />;
}
