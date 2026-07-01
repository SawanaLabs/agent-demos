import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { traceEvalAgentDemoMeta } from "@/features/trace-eval-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={traceEvalAgentDemoMeta} />;
}
