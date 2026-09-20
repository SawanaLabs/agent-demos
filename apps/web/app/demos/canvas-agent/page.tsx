import { canvasSetup } from "@/features/canvas-agent/server/env";
import { CanvasWorkspace } from "@/features/canvas-agent/ui/canvas-workspace";
export const dynamic = "force-dynamic";
export default function CanvasAgentPage() {
  return <CanvasWorkspace ready={canvasSetup().ready} />;
}
