import { Badge } from "@workspace/ui/components/badge";

import { getOpenAiAgentsSdkDemoRuntimeState } from "@/features/openai-agents-sdk-demo/server/runtime";
import { OpenAiAgentsSdkDemoWorkspace } from "@/features/openai-agents-sdk-demo/ui/openai-agents-sdk-demo-workspace";

export function OpenAiAgentsSdkDemoScreen() {
  const runtimeState = getOpenAiAgentsSdkDemoRuntimeState();

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <header className="grid gap-4 border border-foreground/10 bg-background px-4 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Demo / OpenAI Agents SDK
            </p>
            <h1 className="max-w-3xl font-medium text-2xl tracking-tight">
              Official OpenAI Agents backend, current AI SDK frontend
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm/relaxed">
              This slice proves the narrowest official integration path: OpenAI
              Agents SDK on the server, the official AI SDK UI bridge in the
              route, and the existing chat workspace left intact.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{runtimeState.statusLabel}</Badge>
            <Badge variant="outline">{runtimeState.chatModel}</Badge>
          </div>
        </header>

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
      </div>
    </main>
  );
}
