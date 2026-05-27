import {
  createSandboxAgentToolset,
  type SandboxAgentToolset,
} from "./official-tools";
import {
  getSharedSandboxAgentSessionRegistry,
  SANDBOX_AGENT_PREVIEW_PORT,
  type SandboxAgentSession,
} from "./session";
import { getSandboxAgentEnv, type SandboxAgentEnv } from "./env";

export const defaultSandboxAgentSuggestedUseCases = [
  "Build a pricing landing page with an interactive calculator and start a live preview.",
  "Create a product microsite with HTML, CSS, and JavaScript, then expose the result through the sandbox preview.",
  "Iterate on a generated landing page, update the copy and calculator logic, and refresh the same sandbox preview.",
] as const;

export interface SandboxAgentWorkspace {
  readonly artifactsRoot: string;
  readonly previewPort: number;
  readonly projectRoot: string;
  readonly session: SandboxAgentSession;
  readonly suggestedUseCases: readonly string[];
  readonly suggestedUseCasesText: string;
  readonly toolset: SandboxAgentToolset;
}

export function formatSuggestedUseCases(useCases: readonly string[]) {
  return useCases.map((useCase) => `- ${useCase}`).join("\n");
}

export async function createSandboxAgentWorkspace(
  {
    env = getSandboxAgentEnv(),
    sessionId,
    suggestedUseCases = defaultSandboxAgentSuggestedUseCases,
  }: {
    env?: SandboxAgentEnv;
    sessionId: string;
    suggestedUseCases?: readonly string[];
  },
  dependencies: {
    createToolset?: typeof createSandboxAgentToolset;
    getSession?: (sessionId: string) => SandboxAgentSession;
  } = {}
): Promise<SandboxAgentWorkspace> {
  const registry = getSharedSandboxAgentSessionRegistry(env);
  const getSession =
    dependencies.getSession ?? registry.getSession.bind(registry);
  const session = getSession(sessionId);
  const createToolset = dependencies.createToolset ?? createSandboxAgentToolset;
  const toolset = await createToolset({
    session,
  });

  return {
    artifactsRoot: session.artifactsRoot,
    previewPort: SANDBOX_AGENT_PREVIEW_PORT,
    projectRoot: session.projectRoot,
    session,
    suggestedUseCases,
    suggestedUseCasesText: formatSuggestedUseCases(suggestedUseCases),
    toolset,
  };
}
