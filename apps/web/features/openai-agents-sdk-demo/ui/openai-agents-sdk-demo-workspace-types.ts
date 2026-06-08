import type { OpenAiAgentsSdkDemoContextProfile } from "../server/context";
import type { OpenAiAgentsSdkDemoAiSdkExtensionProfile } from "../server/extensions";
import type { OpenAiAgentsSdkDemoGuardrailCatalogEntry } from "../server/guardrails";
import type { OpenAiAgentsSdkDemoGuideCoverage } from "../server/guide-coverage";
import type { OpenAiAgentsSdkDemoHandoffCatalogEntry } from "../server/handoffs";
import type {
  OpenAiAgentsSdkDemoMcpCatalogEntry,
  OpenAiAgentsSdkDemoMcpProfile,
} from "../server/mcp";
import type { OpenAiAgentsSdkDemoModelProfile } from "../server/models";
import type { OpenAiAgentsSdkDemoRunProfile } from "../server/running";
import type { OpenAiAgentsSdkDemoSandboxProfile } from "../server/sandbox";
import type { OpenAiAgentsSdkDemoSessionProfile } from "../server/sessions";
import type { OpenAiAgentsSdkDemoToolCatalogEntry } from "../server/tools";
import type { OpenAiAgentsSdkDemoTraceProfile } from "../server/tracing";
import type { OpenAiAgentsSdkDemoVoiceProfile } from "../server/voice";

export interface OpenAiAgentsSdkDemoChatError {
  id: string;
  message: string;
  retryText: string | null;
}

export interface OpenAiAgentsSdkDemoWorkspaceProps {
  aiSdkExtensionProfile: OpenAiAgentsSdkDemoAiSdkExtensionProfile;
  chatModel: string;
  contextProfile: OpenAiAgentsSdkDemoContextProfile;
  guardrailCatalog: OpenAiAgentsSdkDemoGuardrailCatalogEntry[];
  guideCoverage: OpenAiAgentsSdkDemoGuideCoverage[];
  handoffCatalog: OpenAiAgentsSdkDemoHandoffCatalogEntry[];
  isChatAvailable: boolean;
  mcpCatalog: OpenAiAgentsSdkDemoMcpCatalogEntry[];
  mcpProfile: OpenAiAgentsSdkDemoMcpProfile;
  modelProfile: OpenAiAgentsSdkDemoModelProfile;
  nodeVersion: string;
  runProfile: OpenAiAgentsSdkDemoRunProfile;
  sandboxProfile: OpenAiAgentsSdkDemoSandboxProfile;
  sessionProfile: OpenAiAgentsSdkDemoSessionProfile;
  setupMessage: string | null;
  toolCatalog: OpenAiAgentsSdkDemoToolCatalogEntry[];
  traceProfile: OpenAiAgentsSdkDemoTraceProfile;
  voiceProfile: OpenAiAgentsSdkDemoVoiceProfile;
}
