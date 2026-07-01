import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { mcpAgentDemoMeta } from "@/features/mcp-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={mcpAgentDemoMeta} />;
}
