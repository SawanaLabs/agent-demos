import { getSandboxAgentEnv, getSandboxAgentSetupState } from "./env";
import { resolveSandboxAgentChatModel } from "./model";
import { SANDBOX_AGENT_PREVIEW_PORT } from "./session";

export interface SandboxAgentRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  previewPort: number;
  sandboxProvider: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

export function getSandboxAgentRuntimeState(
  env = getSandboxAgentEnv()
): SandboxAgentRuntimeState {
  const setupState = getSandboxAgentSetupState(env);

  return {
    chatModel: resolveSandboxAgentChatModel(env),
    isChatAvailable: setupState.isReady,
    nodeVersion: setupState.nodeVersion,
    previewPort: SANDBOX_AGENT_PREVIEW_PORT,
    sandboxProvider: setupState.sandboxProvider,
    setupMessage:
      setupState.issues.length > 0 ? setupState.issues.join(" ") : null,
    statusLabel: setupState.isReady ? "Ready" : "Setup required",
  };
}
