import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { generativeUiDemoMeta } from "@/features/generative-ui/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={generativeUiDemoMeta} />;
}
