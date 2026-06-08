import { OpenAiAgentsSdkDemoAgentInspectorPanels } from "./openai-agents-sdk-demo-agent-inspector-panels";
import { OpenAiAgentsSdkDemoCatalogInspectorPanels } from "./openai-agents-sdk-demo-catalog-inspector-panels";
import type { OpenAiAgentsSdkDemoRuntimeInspector } from "./openai-agents-sdk-demo-inspector-types";
import { OpenAiAgentsSdkDemoRuntimeInspectorPanels } from "./openai-agents-sdk-demo-runtime-inspector-panels";
import { OpenAiAgentsSdkDemoVoiceInspectorPanel } from "./openai-agents-sdk-demo-voice-inspector-panel";
import { OpenAiAgentsSdkDemoVoicePanel } from "./openai-agents-sdk-demo-voice-panel";
import type { OpenAiAgentsSdkDemoWorkspaceProps } from "./openai-agents-sdk-demo-workspace-types";

type OpenAiAgentsSdkDemoInspectorSidebarProps = Pick<
  OpenAiAgentsSdkDemoWorkspaceProps,
  | "aiSdkExtensionProfile"
  | "contextProfile"
  | "guardrailCatalog"
  | "handoffCatalog"
  | "mcpCatalog"
  | "mcpProfile"
  | "modelProfile"
  | "nodeVersion"
  | "runProfile"
  | "sandboxProfile"
  | "sessionProfile"
  | "toolCatalog"
  | "traceProfile"
  | "voiceProfile"
> & {
  onVoiceGuideUsageChange: (hasUsedVoiceGuide: boolean) => void;
  runtimeInspector: OpenAiAgentsSdkDemoRuntimeInspector;
};

export function OpenAiAgentsSdkDemoInspectorSidebar({
  aiSdkExtensionProfile,
  contextProfile,
  guardrailCatalog,
  handoffCatalog,
  mcpCatalog,
  mcpProfile,
  modelProfile,
  nodeVersion,
  onVoiceGuideUsageChange,
  runProfile,
  runtimeInspector,
  sandboxProfile,
  sessionProfile,
  toolCatalog,
  traceProfile,
  voiceProfile,
}: OpenAiAgentsSdkDemoInspectorSidebarProps) {
  return (
    <aside className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden border border-foreground/10 bg-background">
      <OpenAiAgentsSdkDemoVoicePanel
        onUsageChange={onVoiceGuideUsageChange}
        voiceProfile={voiceProfile}
      />

      <div className="min-w-0 space-y-5 overflow-y-auto overflow-x-hidden p-4">
        <OpenAiAgentsSdkDemoRuntimeInspectorPanels
          aiSdkExtensionProfile={aiSdkExtensionProfile}
          contextProfile={contextProfile}
          nodeVersion={nodeVersion}
          runProfile={runProfile}
          runtimeInspector={runtimeInspector}
          sessionProfile={sessionProfile}
        />
        <OpenAiAgentsSdkDemoVoiceInspectorPanel voiceProfile={voiceProfile} />
        <OpenAiAgentsSdkDemoAgentInspectorPanels
          handoffCatalog={handoffCatalog}
          mcpCatalog={mcpCatalog}
          mcpProfile={mcpProfile}
          modelProfile={modelProfile}
          runtimeInspector={runtimeInspector}
          sandboxProfile={sandboxProfile}
          traceProfile={traceProfile}
        />
        <OpenAiAgentsSdkDemoCatalogInspectorPanels
          guardrailCatalog={guardrailCatalog}
          runtimeInspector={runtimeInspector}
          toolCatalog={toolCatalog}
        />
      </div>
    </aside>
  );
}
