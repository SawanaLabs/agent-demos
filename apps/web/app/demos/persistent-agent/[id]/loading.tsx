import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { persistentAgentDemoMeta } from "@/features/persistent-agent/demo-meta";

export default function Loading() {
  return (
    <DemoRouteLoadingScreen
      demo={persistentAgentDemoMeta}
      summary="The saved conversation and recent chat list are loading for this visitor."
      title="Opening persistent conversation"
    />
  );
}
