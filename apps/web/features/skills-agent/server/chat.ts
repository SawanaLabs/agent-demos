import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  createAgentUIStreamResponse,
  stepCountIs,
  ToolLoopAgent,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { createAiGateway } from "@/features/shared/ai-gateway/server/env";
import { SKILLS_AGENT_WORKSPACE_ROOT } from "./local-skill-catalog";
import {
  resolveSkillsAgentChatModel,
  SKILLS_AGENT_PROVIDER_OPTIONS,
} from "./model";
import { createSkillsAgentOfficialTools } from "./official-tools";
import {
  getSharedSkillsAgentSessionRegistry,
  SANDBOX_ARTIFACTS_ROOT,
  SANDBOX_PROJECT_ROOT,
} from "./sandbox";
import type { SkillMetadata } from "./skill-catalog";

type DemoEnv = Record<string, string | undefined>;

const skillOptionSchema = z.object({
  description: z.string(),
  name: z.string(),
  path: z.string(),
});

const skillsAgentCallOptionsSchema = z.object({
  skills: z.array(skillOptionSchema).min(1),
});

type SkillsAgentCallOptions = z.infer<typeof skillsAgentCallOptionsSchema>;

export const skillsAgentInstructions = [
  "You are the skills-agent demo for a product and engineering team.",
  "Treat the visible skill catalog as lightweight metadata. Load the full SKILL.md only when you decide a skill is needed.",
  "Choose a skill based on the visible catalog descriptions when the user's request matches one of them.",
  "Use readFile, writeFile, and bash inside the Vercel Sandbox when the skill instructions require repository context or generated artifacts.",
  "Follow the loaded skill's filesystem conventions. grill-with-docs owns repository paths like CONTEXT.md and docs/adr/, while artifacts/ is for standalone drafts when a skill does not specify a canonical location.",
  "Repository files such as CONTEXT.md or docs/adr/ may not exist yet. Use bash checks like test -f or ls before reading optional files, and create them lazily when the loaded skill calls for that.",
  "Keep the final answer concise and report any artifact paths that were created or updated.",
].join(" ");

export function toVisibleSkillCatalog(skills: SkillMetadata[]) {
  return skills.map(({ description, name, path }) => ({
    description,
    name,
    path,
  }));
}

export function formatVisibleSkillCatalog(options: SkillsAgentCallOptions) {
  return options.skills
    .map(
      (skill) => `- ${skill.name}: ${skill.description} (path: ${skill.path})`
    )
    .join("\n");
}

export async function streamSkillsAgent(
  messages: UIMessage[],
  {
    env = process.env,
    sessionId,
    skills,
  }: {
    env?: DemoEnv;
    sessionId: string;
    skills: SkillMetadata[];
  }
) {
  const gateway = createAiGateway(env);
  const chatModel = resolveSkillsAgentChatModel(env);
  const session =
    getSharedSkillsAgentSessionRegistry(env).getSession(sessionId);
  const agentsContent = await readFile(
    path.join(SKILLS_AGENT_WORKSPACE_ROOT, "AGENTS.md"),
    "utf-8"
  );
  const officialToolkit = await createSkillsAgentOfficialTools({
    agentsContent,
    projectRoot: SANDBOX_PROJECT_ROOT,
    session,
    skillsDirectory: path.join(SKILLS_AGENT_WORKSPACE_ROOT, ".agents/skills"),
  });

  const agent = new ToolLoopAgent<SkillsAgentCallOptions>({
    instructions: skillsAgentInstructions,
    model: gateway(chatModel),
    prepareCall: ({ options, ...call }) => ({
      ...call,
      instructions: [
        skillsAgentInstructions,
        `Visible skill catalog:\n${formatVisibleSkillCatalog(options)}`,
        `Sandbox project root: ${SANDBOX_PROJECT_ROOT}`,
        `Default artifacts root: ${SANDBOX_ARTIFACTS_ROOT}`,
      ].join("\n\n"),
    }),
    providerOptions: SKILLS_AGENT_PROVIDER_OPTIONS,
    callOptionsSchema: skillsAgentCallOptionsSchema,
    stopWhen: stepCountIs(8),
    tools: officialToolkit.tools,
  });

  return await createAgentUIStreamResponse({
    agent,
    options: {
      skills: toVisibleSkillCatalog(skills),
    },
    sendReasoning: true,
    uiMessages: messages,
  });
}
