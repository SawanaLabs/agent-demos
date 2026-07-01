import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { objectGenerationDemoMeta } from "@/features/object-generation/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={objectGenerationDemoMeta} />;
}
