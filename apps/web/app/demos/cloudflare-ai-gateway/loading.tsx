import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { cloudflareAiGatewayDemoMeta } from "@/features/cloudflare-ai-gateway/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={cloudflareAiGatewayDemoMeta} />;
}
