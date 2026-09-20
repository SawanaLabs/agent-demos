import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { canvasAgentDemoMeta } from "@/features/canvas-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={canvasAgentDemoMeta} />;
}
