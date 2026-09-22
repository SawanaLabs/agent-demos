import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { feedbackAgentDemoMeta } from "@/features/feedback-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={feedbackAgentDemoMeta} />;
}
