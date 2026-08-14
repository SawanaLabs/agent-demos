import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { imageWorkflowAgentDemoMeta } from "@/features/image-workflow-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={imageWorkflowAgentDemoMeta} />;
}
