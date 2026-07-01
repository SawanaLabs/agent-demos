import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { customerMemoryAgentDemoMeta } from "@/features/customer-memory-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={customerMemoryAgentDemoMeta} />;
}
