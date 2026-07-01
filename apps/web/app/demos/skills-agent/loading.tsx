import { DemoRouteLoadingScreen } from "@/components/demo-loading-screen";
import { skillsAgentDemoMeta } from "@/features/skills-agent/demo-meta";

export default function Loading() {
  return <DemoRouteLoadingScreen demo={skillsAgentDemoMeta} />;
}
