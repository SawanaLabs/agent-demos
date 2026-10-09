import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";
import { getGatewaySetup } from "@/lib/cloudflare-ai-gateway/server/env";
import { GatewayWorkspace } from "./gateway-workspace";

export function GatewayScreen() {
  const setup = getGatewaySetup();
  return (
    <DemoWorkspaceShell
      badges={[setup.gateway, setup.authMode]}
      breadcrumbTitle="Cloudflare AI Gateway"
      summary="Create and edit images with GPT Image 2 or Gemini 3.1 Flash Image through your selected gateway."
      title="Image gateway migration"
    >
      <GatewayWorkspace setup={setup} />
    </DemoWorkspaceShell>
  );
}
