import {
  getSkillsAgentEnv,
  getSkillsAgentSetupState,
  SKILLS_AGENT_SANDBOX_ENVIRONMENT_LABEL,
} from "./env";
import { discoverWorkspaceSkills } from "./local-skill-catalog";
import type { SkillMetadata } from "./skill-catalog";

type DemoEnv = Record<string, string | undefined>;

export interface SkillsAgentRuntimeState {
  availableSkills: Pick<SkillMetadata, "description" | "name">[];
  chatModel: string;
  environmentLabel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  sandboxProvider: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

export async function getSkillsAgentRuntimeState(
  env: DemoEnv = getSkillsAgentEnv(),
  dependencies: {
    discoverSkills: () => Promise<SkillMetadata[]>;
  } = {
    discoverSkills: discoverWorkspaceSkills,
  }
): Promise<SkillsAgentRuntimeState> {
  const setup = getSkillsAgentSetupState(env);
  const skills = await dependencies.discoverSkills();
  const issues = [...setup.issues];

  if (skills.length === 0) {
    issues.push(
      'No primary skills were found under ".agents/skills". The demo expects grill-with-docs and skill-creator.'
    );
  }

  return {
    availableSkills: skills.map(({ description, name }) => ({
      description,
      name,
    })),
    chatModel: setup.config.chatModel,
    environmentLabel: SKILLS_AGENT_SANDBOX_ENVIRONMENT_LABEL,
    isChatAvailable: issues.length === 0,
    nodeVersion: setup.nodeVersion,
    sandboxProvider: setup.sandboxProvider,
    setupMessage: issues.length > 0 ? issues.join(" ") : null,
    statusLabel: issues.length === 0 ? "Ready" : "Setup required",
  };
}
