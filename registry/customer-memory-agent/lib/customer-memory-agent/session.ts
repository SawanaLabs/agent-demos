import {
  type CustomerMemoryProfile,
  getCustomerMemoryProfile,
} from "./customer-profiles";
import type { CustomerMemorySessionData } from "./session-data";
import { createCustomerMemoryCompactionStore } from "./compaction-store";
import { findRelevantCustomerMemory } from "./memory-recall";
import { createCustomerMemoryStore } from "./memory-store";
import { ensureCustomerMemorySharedDemoSeed } from "./shared-demo-seed";
import {
  type CustomerMemoryThreadSnapshot,
  type CustomerMemoryThreadSummary,
  createCustomerMemoryThreadStore,
} from "./thread-store";
import {
  type CustomerMemoryViewerContext,
  resolveCustomerMemoryViewerContext,
} from "./viewer-context";

interface CustomerMemorySessionDependencies {
  compactionStore?: ReturnType<typeof createCustomerMemoryCompactionStore>;
  ensureSharedDemoSeed?: typeof ensureCustomerMemorySharedDemoSeed;
  findRelevantCustomerMemory?: typeof findRelevantCustomerMemory;
  memoryStore?: Pick<
    ReturnType<typeof createCustomerMemoryStore>,
    "listEvents" | "listMemories"
  >;
  threadStore?: ReturnType<typeof createCustomerMemoryThreadStore>;
}

function buildDefaultThreadTitle(customer: CustomerMemoryProfile) {
  return `${customer.name} memory thread`;
}

type CustomerMemoryThreadStore = ReturnType<
  typeof createCustomerMemoryThreadStore
>;

interface ResolvedCustomerMemoryThreadSnapshot {
  threadSnapshot: CustomerMemoryThreadSnapshot;
  threads: CustomerMemoryThreadSummary[];
}

function getMissingCustomerMemorySessionThreadError(input: {
  customerId: string;
  threadId: string | null;
}) {
  return `No customer-memory thread found for ${input.threadId} under ${input.customerId}.`;
}

async function createWritableDefaultThreadSnapshot(input: {
  customer: CustomerMemoryProfile;
  threadStore: CustomerMemoryThreadStore;
  viewer: CustomerMemoryViewerContext;
}): Promise<ResolvedCustomerMemoryThreadSnapshot> {
  const thread = await input.threadStore.createThread({
    customerId: input.customer.id,
    title: buildDefaultThreadTitle(input.customer),
    visitorId: input.viewer.visitorId,
  });
  const threads = await input.threadStore.listThreads({
    customerId: input.customer.id,
    visitorId: input.viewer.visitorId,
  });
  const threadSnapshot = await input.threadStore.loadThreadForViewer({
    customerId: input.customer.id,
    threadId: thread.id,
    visitorId: input.viewer.visitorId,
  });

  if (!threadSnapshot) {
    throw new Error(
      getMissingCustomerMemorySessionThreadError({
        customerId: input.customer.id,
        threadId: thread.id,
      })
    );
  }

  return { threadSnapshot, threads };
}

async function resolveMissingThreadSnapshot(input: {
  activeThreadId: string | null;
  customer: CustomerMemoryProfile;
  threadStore: CustomerMemoryThreadStore;
  threads: CustomerMemoryThreadSummary[];
  viewer: CustomerMemoryViewerContext;
}): Promise<ResolvedCustomerMemoryThreadSnapshot> {
  const fallbackThreadId = input.threads[0]?.id ?? null;

  if (!fallbackThreadId) {
    if (input.viewer.isReadonly) {
      throw new Error(
        getMissingCustomerMemorySessionThreadError({
          customerId: input.customer.id,
          threadId: input.activeThreadId,
        })
      );
    }

    return createWritableDefaultThreadSnapshot(input);
  }

  const threadSnapshot = await input.threadStore.loadThreadForViewer({
    customerId: input.customer.id,
    threadId: fallbackThreadId,
    visitorId: input.viewer.visitorId,
  });

  if (!threadSnapshot) {
    throw new Error(
      getMissingCustomerMemorySessionThreadError({
        customerId: input.customer.id,
        threadId: fallbackThreadId,
      })
    );
  }

  return { threadSnapshot, threads: input.threads };
}

async function resolveCustomerMemoryThreadSnapshot(input: {
  customer: CustomerMemoryProfile;
  requestedThreadId?: string | null;
  threadStore: CustomerMemoryThreadStore;
  viewer: CustomerMemoryViewerContext;
}): Promise<ResolvedCustomerMemoryThreadSnapshot> {
  const threads = await input.threadStore.listThreads({
    customerId: input.customer.id,
    visitorId: input.viewer.visitorId,
  });
  const activeThreadId = input.requestedThreadId ?? threads[0]?.id ?? null;

  if (!activeThreadId) {
    if (input.viewer.isReadonly) {
      throw new Error(
        `No shared customer-memory demo thread is available for ${input.customer.id}.`
      );
    }

    return createWritableDefaultThreadSnapshot(input);
  }

  const threadSnapshot = await input.threadStore.loadThreadForViewer({
    customerId: input.customer.id,
    threadId: activeThreadId,
    visitorId: input.viewer.visitorId,
  });

  if (!threadSnapshot) {
    return resolveMissingThreadSnapshot({ ...input, activeThreadId, threads });
  }

  return { threadSnapshot, threads };
}

export async function loadCustomerMemorySession(
  input: {
    customerId: string;
    query?: string;
    threadId?: string | null;
    visitorId: string;
  },
  dependencies: CustomerMemorySessionDependencies = {}
) {
  const customer = getCustomerMemoryProfile(input.customerId);

  if (!customer) {
    throw new Error(`Unknown customer-memory profile: ${input.customerId}`);
  }

  const viewer = resolveCustomerMemoryViewerContext({
    customer,
    visitorId: input.visitorId,
  });
  const threadStore =
    dependencies.threadStore ?? createCustomerMemoryThreadStore();
  const memoryStore = dependencies.memoryStore ?? createCustomerMemoryStore();
  const compactionStore =
    dependencies.compactionStore ?? createCustomerMemoryCompactionStore();

  if (viewer.isReadonly) {
    await (
      dependencies.ensureSharedDemoSeed ?? ensureCustomerMemorySharedDemoSeed
    )(customer);
  }

  const { threadSnapshot, threads } = await resolveCustomerMemoryThreadSnapshot(
    {
      customer,
      requestedThreadId: input.threadId,
      threadStore,
      viewer,
    }
  );

  const [latestCompaction, memories, memoryEvents, relevantMemories] =
    await Promise.all([
      compactionStore.getLatestCompaction(threadSnapshot.thread.id),
      memoryStore.listMemories({
        customerId: customer.id,
        visitorId: viewer.visitorId,
      }),
      memoryStore.listEvents({
        customerId: customer.id,
        visitorId: viewer.visitorId,
      }),
      (dependencies.findRelevantCustomerMemory ?? findRelevantCustomerMemory)({
        customerId: customer.id,
        query: input.query ?? "",
        visitorId: viewer.visitorId,
      }),
    ]);

  return {
    customer,
    latestCompaction,
    memoryEvents,
    memories,
    messages: threadSnapshot.messages,
    relevantMemories,
    thread: threadSnapshot.thread,
    threads,
  } satisfies CustomerMemorySessionData;
}

export async function createCustomerMemoryThread(
  input: {
    customerId: string;
    visitorId: string;
  },
  dependencies: Pick<CustomerMemorySessionDependencies, "threadStore"> = {}
) {
  const customer = getCustomerMemoryProfile(input.customerId);

  if (!customer) {
    throw new Error(`Unknown customer-memory profile: ${input.customerId}`);
  }

  const viewer = resolveCustomerMemoryViewerContext({
    customer,
    visitorId: input.visitorId,
  });
  const thread = await (
    dependencies.threadStore ?? createCustomerMemoryThreadStore()
  ).createThread({
    customerId: customer.id,
    title: buildDefaultThreadTitle(customer),
    visitorId: viewer.visitorId,
  });

  return {
    customer,
    thread,
  };
}
