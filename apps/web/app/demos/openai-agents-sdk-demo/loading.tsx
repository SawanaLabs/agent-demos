import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { openAiAgentsSdkDemoMeta } from "@/features/openai-agents-sdk-demo/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={openAiAgentsSdkDemoMeta} />;
}
