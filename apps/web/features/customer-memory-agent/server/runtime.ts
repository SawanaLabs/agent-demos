import type { UIMessage } from "ai";

import { getAiGatewaySetupState } from "@/features/shared/ai-gateway/server/env";

import { getCustomerMemoryProfile } from "../customer-profiles";
import {
  invalidCustomerIdError,
  invalidMessagesError,
  invalidThreadIdError,
  invalidUiMessagesError,
  malformedJsonError,
  readCustomerMemoryChatRequest,
} from "./contract";
import { customerMemoryCompactionThreshold } from "./compaction";
import { streamCustomerMemoryConversation } from "./conversation";
import { createCustomerMemoryThreadStore } from "./thread-store";
import {
  getReadonlyCustomerMemoryError,
  type CustomerMemoryViewerContext,
  resolveCustomerMemoryViewerContext,
} from "./viewer-context";

type DemoEnv = Record<string, string | undefined>;

interface CustomerMemoryChatRequestDependencies {
  ensureThreadOwnership?: (input: {
    customerId: string;
    threadId: string;
    visitorId: string;
  }) => Promise<void>;
  streamCustomerMemoryConversation: (
    input: {
      customer: NonNullable<ReturnType<typeof getCustomerMemoryProfile>>;
      messages: UIMessage[];
      threadId: string;
      visitorId: string;
    },
    env: DemoEnv
  ) => Promise<Response>;
}

export interface CustomerMemoryRuntimeState {
  chatModel: string;
  compactionThreshold: number;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

function getCustomerMemoryDatabaseIssue(env: DemoEnv) {
  if (env.DATABASE_URL) {
    return null;
  }

  return "DATABASE_URL is missing. The customer-memory agent requires a writable Postgres database.";
}

export function getCustomerMemoryRuntimeState(
  env: DemoEnv = process.env
): CustomerMemoryRuntimeState {
  const setup = getAiGatewaySetupState(env);
  const issues = [...setup.issues];
  const databaseIssue = getCustomerMemoryDatabaseIssue(env);

  if (databaseIssue) {
    issues.push(databaseIssue);
  }

  return {
    chatModel: setup.config.chatModel,
    compactionThreshold: customerMemoryCompactionThreshold,
    isChatAvailable: issues.length === 0,
    nodeVersion: setup.nodeVersion,
    setupMessage: issues.length > 0 ? issues.join(" ") : null,
    statusLabel: issues.length === 0 ? "Ready" : "Setup required",
  };
}

async function ensureCustomerMemoryThreadOwnership(input: {
  customerId: string;
  threadId: string;
  visitorId: string;
}) {
  const snapshot = await createCustomerMemoryThreadStore().loadThreadForViewer(
    input
  );

  if (!snapshot) {
    throw new Error(
      `No customer-memory thread found for ${input.threadId} under ${input.customerId}.`
    );
  }
}

export async function handleCustomerMemoryChatRequest(
  request: Request,
  env: DemoEnv = process.env,
  dependencies: CustomerMemoryChatRequestDependencies = {
    streamCustomerMemoryConversation,
  },
  viewer: CustomerMemoryViewerContext
) {
  const runtimeState = getCustomerMemoryRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: malformedJsonError,
      },
      { status: 400 }
    );
  }

  try {
    const { customerId, messages, threadId } =
      await readCustomerMemoryChatRequest(body);
    const customer = getCustomerMemoryProfile(customerId);

    if (!customer) {
      throw new Error(invalidCustomerIdError);
    }

    const viewerContext = resolveCustomerMemoryViewerContext({
      customer,
      visitorId: viewer.visitorId,
    });

    if (viewerContext.isReadonly) {
      return Response.json(
        {
          error: getReadonlyCustomerMemoryError(customer),
        },
        { status: 403 }
      );
    }

    const ensureThreadOwnership =
      dependencies.ensureThreadOwnership ?? ensureCustomerMemoryThreadOwnership;

    await ensureThreadOwnership({
      customerId,
      threadId,
      visitorId: viewerContext.visitorId,
    });

    return dependencies.streamCustomerMemoryConversation(
      {
        customer,
        messages,
        threadId,
        visitorId: viewerContext.visitorId,
      },
      env
    );
  } catch (error) {
    if (
      error instanceof Error &&
      [
        invalidCustomerIdError,
        invalidMessagesError,
        invalidThreadIdError,
        invalidUiMessagesError,
      ].includes(error.message)
    ) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.startsWith("No customer-memory thread found")) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 404 }
      );
    }

    throw error;
  }
}
