import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";
import { getGatewaySetup } from "../server/env";
import { GatewayWorkspace } from "./gateway-workspace";

export function GatewayScreen() {
  const setup = getGatewaySetup();
  return (
    <DemoWorkspaceShell
      badges={[setup.authMode]}
      breadcrumbTitle="Cloudflare AI Gateway"
      summary="Create an image or edit reference photos with GPT Image 2 and Gemini 3.1 Flash Image."
      title="Cloudflare AI Gateway"
    >
      <GatewayWorkspace setup={setup} />
    </DemoWorkspaceShell>
  );
}
