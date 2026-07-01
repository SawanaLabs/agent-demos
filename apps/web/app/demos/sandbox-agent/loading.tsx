import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { sandboxAgentDemoMeta } from "@/features/sandbox-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={sandboxAgentDemoMeta} />;
}
