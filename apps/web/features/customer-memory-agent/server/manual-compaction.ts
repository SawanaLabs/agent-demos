import { getCustomerMemoryProfile } from "../customer-profiles";
import {
  buildCustomerMemoryCompactionInput,
  generateCustomerMemoryCompactionSummary,
  getCustomerMemoryManualCompactionTargetMessageCount,
} from "./compaction";
import { createCustomerMemoryCompactionStore } from "./compaction-store";
import {
  invalidCustomerIdError,
  invalidThreadIdError,
  malformedJsonError,
  readCustomerMemoryThreadRequest,
} from "./contract";
import {
  type CustomerMemoryAgentEnv,
  getCustomerMemoryAgentEnv,
  getCustomerMemoryAgentSetupState,
} from "./env";
import { createCustomerMemoryThreadStore } from "./thread-store";
import {
  type CustomerMemoryViewerContext,
  getReadonlyCustomerMemoryError,
  resolveCustomerMemoryViewerContext,
} from "./viewer-context";

export const noCustomerMemoryManualCompactionTargetError =
  "No older customer-memory messages are available to compact yet.";

type CustomerMemoryCompactionStore = Pick<
  ReturnType<typeof createCustomerMemoryCompactionStore>,
  "getLatestCompaction" | "saveCompaction"
>;

type CustomerMemoryThreadStore = Pick<
  ReturnType<typeof createCustomerMemoryThreadStore>,
  "loadThreadForViewer"
>;

interface CustomerMemoryManualCompactionDependencies {
  compactionStore?: CustomerMemoryCompactionStore;
  generateSummary?: typeof generateCustomerMemoryCompactionSummary;
  threadStore?: CustomerMemoryThreadStore;
}

function getCustomerMemoryManualCompactionSetupError(
  env: CustomerMemoryAgentEnv
) {
  const setup = getCustomerMemoryAgentSetupState(env);

  return setup.isReady ? null : setup.issues.join(" ");
}

export async function handleCustomerMemoryManualCompactionRequest(
  request: Request,
  viewer: CustomerMemoryViewerContext,
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv(),
  dependencies: CustomerMemoryManualCompactionDependencies = {}
) {
  const setupError = getCustomerMemoryManualCompactionSetupError(env);

  if (setupError) {
    return Response.json({ error: setupError }, { status: 500 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: malformedJsonError }, { status: 400 });
  }

  try {
    const { customerId, threadId } =
      await readCustomerMemoryThreadRequest(body);
    const customer = getCustomerMemoryProfile(customerId);

    if (!customer) {
      throw new Error(`Unknown customer-memory profile: ${customerId}`);
    }

    const viewerContext = resolveCustomerMemoryViewerContext({
      customer,
      visitorId: viewer.visitorId,
    });

    if (viewerContext.isReadonly) {
      return Response.json(
        { error: getReadonlyCustomerMemoryError(customer) },
        { status: 403 }
      );
    }

    const threadStore =
      dependencies.threadStore ?? createCustomerMemoryThreadStore();
    const threadSnapshot = await threadStore.loadThreadForViewer({
      customerId,
      threadId,
      visitorId: viewerContext.visitorId,
    });

    if (!threadSnapshot) {
      return Response.json(
        {
          error: `No customer-memory thread found for ${threadId} under ${customerId}.`,
        },
        { status: 404 }
      );
    }

    const compactionStore =
      dependencies.compactionStore ?? createCustomerMemoryCompactionStore();
    const latestCompaction =
      await compactionStore.getLatestCompaction(threadId);
    const targetMessageCount =
      getCustomerMemoryManualCompactionTargetMessageCount({
        latestCompaction,
        messageCount: threadSnapshot.messages.length,
      });

    if (targetMessageCount === null) {
      return Response.json(
        { error: noCustomerMemoryManualCompactionTargetError },
        { status: 409 }
      );
    }

    const compactionInput = buildCustomerMemoryCompactionInput({
      latestCompaction,
      messages: threadSnapshot.messages,
      targetMessageCount,
    });
    const summary = await (
      dependencies.generateSummary ?? generateCustomerMemoryCompactionSummary
    )(
      {
        customerLabel: customer.name,
        messages: compactionInput.messages,
        previousHandoff: compactionInput.previousHandoff,
      },
      env
    );
    const compaction = await compactionStore.saveCompaction({
      messageCount: targetMessageCount,
      summary,
      threadId,
    });

    return Response.json({ compaction }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      [invalidCustomerIdError, invalidThreadIdError].includes(error.message)
    ) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Unknown customer-memory profile")
    ) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    throw error;
  }
}
