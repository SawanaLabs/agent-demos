import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";

import { getOpenAiAgentsSdkDemoRuntimeState } from "@/lib/openai-agents-sdk-demo/server/runtime";
import { OpenAiAgentsSdkDemoWorkspace } from "@/components/openai-agents-sdk-demo/openai-agents-sdk-demo-workspace";

export function OpenAiAgentsSdkDemoScreen() {
  const runtimeState = getOpenAiAgentsSdkDemoRuntimeState();

  return (
    <DemoWorkspaceShell
      badges={[runtimeState.statusLabel, runtimeState.chatModel]}
      breadcrumbTitle="OpenAI Agents SDK"
      summary="This slice proves the narrowest official integration path: OpenAI Agents SDK on the server, the official AI SDK UI bridge in the route, and the existing chat workspace left intact."
      title="Official OpenAI Agents backend, current AI SDK frontend"
      workspaceClassName={null}
    >
      <OpenAiAgentsSdkDemoWorkspace
        aiSdkExtensionProfile={runtimeState.aiSdkExtensionProfile}
        chatModel={runtimeState.chatModel}
        contextProfile={runtimeState.contextProfile}
        guardrailCatalog={runtimeState.guardrailCatalog}
        guideCoverage={runtimeState.guideCoverage}
        handoffCatalog={runtimeState.handoffCatalog}
        isChatAvailable={runtimeState.isChatAvailable}
        mcpCatalog={runtimeState.mcpCatalog}
        mcpProfile={runtimeState.mcpProfile}
        modelProfile={runtimeState.modelProfile}
        nodeVersion={runtimeState.nodeVersion}
        runProfile={runtimeState.runProfile}
        sandboxProfile={runtimeState.sandboxProfile}
        sessionProfile={runtimeState.sessionProfile}
        setupMessage={runtimeState.setupMessage}
        toolCatalog={runtimeState.toolCatalog}
        traceProfile={runtimeState.traceProfile}
        voiceProfile={runtimeState.voiceProfile}
      />
    </DemoWorkspaceShell>
  );
}
