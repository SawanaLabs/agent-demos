import { type UIMessage, validateUIMessages } from "ai";

import { getSkillsAgentEnv } from "./env";
import { discoverWorkspaceSkills } from "./local-skill-catalog";
import { getSkillsAgentRuntimeState } from "./runtime";
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

export async function handleSkillsAgentRequest(
  request: Request,
  env: DemoEnv = getSkillsAgentEnv(),
  dependencies: Partial<SkillsAgentRequestDependencies> = {
    discoverSkills: discoverWorkspaceSkills,
    streamSkillsAgent: async (messages, options) => {
      const { streamSkillsAgent } = await import("./chat");

      return streamSkillsAgent(messages, {
        env,
        sessionId: options.sessionId,
        skills: options.skills,
      });
    },
  }
) {
  const discoverSkills = dependencies.discoverSkills ?? discoverWorkspaceSkills;
  const streamAgent =
    dependencies.streamSkillsAgent ??
    (async (messages: UIMessage[], options: StreamSkillsAgentOptions) => {
      const { streamSkillsAgent } = await import("./chat");

      return streamSkillsAgent(messages, {
        env,
        sessionId: options.sessionId,
        skills: options.skills,
      });
    });
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
