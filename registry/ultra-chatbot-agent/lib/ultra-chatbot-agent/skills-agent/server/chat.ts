import {
  createAgentUIStreamResponse,
  stepCountIs,
  ToolLoopAgent,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { createSkillsAgentGateway, getSkillsAgentEnv } from "./env";
import {
  resolveSkillsAgentChatModel,
  SKILLS_AGENT_PROVIDER_OPTIONS,
} from "./model";
import type { SkillMetadata } from "./skill-catalog";
import { createSkillsAgentWorkspace } from "./workspace";

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
  "Use readFile, writeFile, and bash inside the active sandbox workspace when the skill instructions require repository context or generated artifacts.",
  "Follow the loaded skill's filesystem conventions. grill-with-docs owns repository paths like CONTEXT.md and docs/adr/, while artifacts/ is for standalone drafts when a skill does not specify a canonical location.",
  "Repository files such as CONTEXT.md or docs/adr/ may not exist yet. Use bash checks like test -f or ls before reading optional files, and create them lazily when the loaded skill calls for that.",
  "Keep the final answer concise and report any artifact paths that were created or updated.",
].join(" ");

export async function streamSkillsAgent(
  messages: UIMessage[],
  {
    env = getSkillsAgentEnv(),
    sessionId,
    skills,
  }: {
    env?: DemoEnv;
    sessionId: string;
    skills: SkillMetadata[];
  }
) {
  const gateway = createSkillsAgentGateway(env);
  const chatModel = resolveSkillsAgentChatModel(env);
  const workspace = await createSkillsAgentWorkspace({
    env,
    sessionId,
    skills,
  });

  const agent = new ToolLoopAgent<SkillsAgentCallOptions>({
    instructions: skillsAgentInstructions,
    model: gateway(chatModel),
    prepareCall: (call) => ({
      ...call,
      instructions: [
        skillsAgentInstructions,
        `Visible skill catalog:\n${workspace.visibleSkillCatalogText}`,
        `Sandbox project root: ${workspace.projectRoot}`,
        `Default artifacts root: ${workspace.artifactsRoot}`,
      ].join("\n\n"),
    }),
    providerOptions: SKILLS_AGENT_PROVIDER_OPTIONS,
    callOptionsSchema: skillsAgentCallOptionsSchema,
    stopWhen: stepCountIs(20),
    tools: workspace.toolset.tools,
  });

  return await createAgentUIStreamResponse({
    agent,
    options: {
      skills: workspace.visibleSkillCatalog,
    },
    sendReasoning: true,
    uiMessages: messages,
  });
}
