import { type UIMessage, validateUIMessages } from "ai";

import { getAiGatewaySetupState } from "@/features/shared/ai-gateway/server/env";

import { streamSkillsAgent } from "./chat";
import { discoverWorkspaceSkills } from "./local-skill-catalog";
import { resolveSkillsAgentChatModel } from "./model";
import { getSkillsAgentSandboxSetupState } from "./sandbox";
import type { SkillMetadata } from "./skill-catalog";

type DemoEnv = Record<string, string | undefined>;

interface SkillsAgentRequestBody {
  id?: string;
  messages?: UIMessage[];
}

interface StreamSkillsAgentOptions {
  sessionId: string;
  skills: SkillMetadata[];
}

interface SkillsAgentRequestDependencies {
  discoverSkills: () => Promise<SkillMetadata[]>;
  streamSkillsAgent: (
    messages: UIMessage[],
    options: StreamSkillsAgentOptions
  ) => Promise<Response> | Response;
}

export interface SkillsAgentRuntimeState {
  availableSkills: Pick<SkillMetadata, "description" | "name">[];
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  sandboxProvider: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
const invalidChatIdError =
  'Expected a JSON body with an "id" string and a "messages" array.';

async function readSkillsAgentRequest(
  body: unknown
): Promise<{ messages: UIMessage[]; sessionId: string }> {
  const { id, messages } = (body ?? {}) as SkillsAgentRequestBody;

  if (!(typeof id === "string" && id.length > 0 && Array.isArray(messages))) {
    throw new Error(invalidChatIdError);
  }

  try {
    return {
      messages: await validateUIMessages({ messages }),
      sessionId: id,
    };
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

export async function getSkillsAgentRuntimeState(
  env: DemoEnv = process.env,
  dependencies: {
    discoverSkills: () => Promise<SkillMetadata[]>;
  } = {
    discoverSkills: discoverWorkspaceSkills,
  }
): Promise<SkillsAgentRuntimeState> {
  const gatewaySetup = getAiGatewaySetupState(env);
  const sandboxSetup = getSkillsAgentSandboxSetupState(env);
  const skills = await dependencies.discoverSkills();
  const issues = [...gatewaySetup.issues, ...sandboxSetup.issues];

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
    chatModel: resolveSkillsAgentChatModel(env),
    isChatAvailable: issues.length === 0,
    nodeVersion: gatewaySetup.nodeVersion,
    sandboxProvider: sandboxSetup.providerLabel,
    setupMessage: issues.length > 0 ? issues.join(" ") : null,
    statusLabel: issues.length === 0 ? "Ready" : "Setup required",
  };
}

export async function handleSkillsAgentRequest(
  request: Request,
  env: DemoEnv = process.env,
  dependencies: Partial<SkillsAgentRequestDependencies> = {
    discoverSkills: discoverWorkspaceSkills,
    streamSkillsAgent: (messages, options) =>
      streamSkillsAgent(messages, {
        env,
        sessionId: options.sessionId,
        skills: options.skills,
      }),
  }
) {
  const discoverSkills = dependencies.discoverSkills ?? discoverWorkspaceSkills;
  const streamAgent =
    dependencies.streamSkillsAgent ??
    ((messages: UIMessage[], options: StreamSkillsAgentOptions) =>
      streamSkillsAgent(messages, {
        env,
        sessionId: options.sessionId,
        skills: options.skills,
      }));
  const runtimeState = await getSkillsAgentRuntimeState(env, {
    discoverSkills,
  });

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  try {
    const { messages, sessionId } = await readSkillsAgentRequest(
      await request.json()
    );
    const skills = await discoverSkills();

    return streamAgent(messages, { sessionId, skills });
  } catch (error) {
    if (
      error instanceof Error &&
      [invalidUiMessagesError, invalidChatIdError].includes(error.message)
    ) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    throw error;
  }
}
