import { type UIMessage, validateUIMessages } from "ai";
import { getMcpAgentEnv, getMcpAgentSetupState } from "./env";
import { streamMcpAgent } from "./chat";
import { projectMcpToolDefinitions } from "./project-tools";

type DemoEnv = Record<string, string | undefined>;

interface McpAgentRequestBody {
  id?: string;
  messages?: UIMessage[];
}

interface StreamMcpAgentOptions {
  origin: string;
  sessionId: string;
}

interface McpAgentRequestDependencies {
  streamMcpAgent: (
    messages: UIMessage[],
    options: StreamMcpAgentOptions
  ) => Promise<Response> | Response;
}

export interface ConfiguredMcpServer {
  description: string;
  name: string;
  requiredSetup: string;
  transport: "http" | "stdio";
}

export interface McpAgentRuntimeState {
  chatModel: string;
  configuredServers: ConfiguredMcpServer[];
  configuredTools: { description: string; name: string; server: string }[];
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
const invalidChatIdError =
  'Expected a JSON body with an "id" string and a "messages" array.';

export const configuredMcpServers: ConfiguredMcpServer[] = [
  {
    description:
      "Repository-local MCP server for demo catalog, project docs, and checklist evidence.",
    name: "project-docs",
    requiredSetup: "Built in",
    transport: "http",
  },
  {
    description:
      "Optional local Next.js development MCP server for route, log, and runtime diagnostics.",
    name: "nextjs-runtime",
    requiredSetup: "Run a Next.js dev server for the target app",
    transport: "stdio",
  },
];

export const configuredMcpTools = [
  ...projectMcpToolDefinitions.map((tool) => ({
    description: tool.description,
    name: `project__${tool.name}`,
    server: "project-docs",
  })),
  {
    description:
      "Discovered from next-devtools-mcp when a compatible Next.js dev server is running.",
    name: "nextjs__*",
    server: "nextjs-runtime",
  },
];

async function readMcpAgentRequest(
  body: unknown
): Promise<{ messages: UIMessage[]; sessionId: string }> {
  const { id, messages } = (body ?? {}) as McpAgentRequestBody;

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

export function getMcpAgentRuntimeState(
  env: DemoEnv = getMcpAgentEnv()
): McpAgentRuntimeState {
  const setup = getMcpAgentSetupState(env);
  const issues = [...setup.issues];

  return {
    chatModel: setup.config.chatModel,
    configuredServers: configuredMcpServers,
    configuredTools: configuredMcpTools,
    isChatAvailable: issues.length === 0,
    nodeVersion: setup.nodeVersion,
    setupMessage: issues.length > 0 ? issues.join(" ") : null,
    statusLabel: issues.length === 0 ? "Ready" : "Setup required",
  };
}

export async function handleMcpAgentRequest(
  request: Request,
  env: DemoEnv = getMcpAgentEnv(),
  dependencies: Partial<McpAgentRequestDependencies> = {
    streamMcpAgent: (messages, options) =>
      streamMcpAgent(messages, {
        env,
        origin: options.origin,
      }),
  }
) {
  const streamAgent =
    dependencies.streamMcpAgent ??
    ((messages: UIMessage[], options: StreamMcpAgentOptions) =>
      streamMcpAgent(messages, {
        env,
        origin: options.origin,
      }));
  const runtimeState = getMcpAgentRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  try {
    const { messages, sessionId } = await readMcpAgentRequest(
      await request.json()
    );

    return streamAgent(messages, {
      origin: new URL(request.url).origin,
      sessionId,
    });
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
