import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { agentUxPrimitivesDemoMeta } from "@/features/agent-ux-primitives/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={agentUxPrimitivesDemoMeta} />;
}
